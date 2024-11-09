package shell

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"

	"lunchpail.io/pkg/be/local/files"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

func Spawn(ctx context.Context, c llir.ShellComponent, ir llir.LLIR, logdir string, completionIndex int, opts build.LogOptions) error {
	pidfile, err := files.Pidfile(ir.Context.Run, c.InstanceName, c.C(), true)
	if err != nil {
		return err
	}

	workdir, command, err := PrepareWorkdirForComponent(c, opts)
	if err != nil {
		return err
	}
	defer os.RemoveAll(workdir)

	// tee command output to the logdir
	instance := strings.Replace(strings.Replace(c.InstanceName, ir.RunName(), "", 1), "--", "-", 1)
	logfile := files.LogFileForComponent(c.C())
	if len(instance) > 0 {
		logfile = logfile + "-" + instance
	}

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Launching process for component %v instance %s with commandline: %s\n", c.C(), c.InstanceName, command)
	}

	cmd := exec.CommandContext(ctx, "/bin/sh", "-c", command)
	cmd.Dir = workdir
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	if outfile, err := os.Create(filepath.Join(logdir, logfile+".out")); err != nil {
		return err
	} else {
		cmd.Stdout = outfile
	}

	if errfile, err := os.Create(filepath.Join(logdir, logfile+".err")); err != nil {
		return err
	} else {
		cmd.Stderr = errfile
	}

	if env, err := addEnv(c, ir, completionIndex); err != nil {
		return err
	} else {
		cmd.Env = env
	}

	if err := cmd.Start(); err != nil {
		return err
	}

	if err := WritePid(pidfile, cmd.Process.Pid); err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
	}

	// by default, Go does not kill the entire process tree on
	// context cancellation, sigh
	go killProcessGroupOnContextCancellation(ctx, cmd, opts)

	if err := cmd.Wait(); err != nil {
		return err
	}

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Process exited with commandline: %s\n", command)
	}

	return nil
}

func addEnv(c llir.ShellComponent, ir llir.LLIR, completionIndex int) ([]string, error) {
	var err error
	var absPathToThisExe string
	absPathToThisExe, err = filepath.Abs(os.Args[0])
	if err != nil {
		return nil, err
	}

	// TODO: how much of user's env do we really want to expose? maybe just PATH?
	env := []string{
		"PATH=" + os.Getenv("PATH"),
		"HOME=" + os.Getenv("HOME"),
		"LUNCHPAIL_COMPONENT=" + string(c.C()),
		"LUNCHPAIL_EXE=" + absPathToThisExe,
		"LUNCHPAIL_POD_NAME=" + c.InstanceName,
		"JOB_COMPLETION_INDEX=" + strconv.Itoa(completionIndex),
		"LUNCHPAIL_VENV_CACHEDIR=" + os.Getenv("LUNCHPAIL_VENV_CACHEDIR"),
		"TEST_QUEUE_ENDPOINT=" + ir.Context.Queue.Endpoint,
		"LUNCHPAIL_TARGET=local",
		"PYTHONUNBUFFERED=1",
	}

	env, err = addAppEnv(env, c)
	if err != nil {
		return env, err
	}

	env, err = addQueueEnv(env, ir)
	if err != nil {
		return env, err
	}

	return addAllSecrets(env, c.Application.Spec.Datasets, ir)
}

func addAppEnv(env []string, c llir.ShellComponent) ([]string, error) {
	for k, v := range c.Application.Spec.Env {
		env = append(env, k+"="+v)
	}

	return env, nil
}

func addQueueEnv(env []string, ir llir.LLIR) ([]string, error) {
	prefix := "lunchpail_queue_" // TODO share with be/kubernetes/shell.envForQueue()

	env = append(env, prefix+"endpoint="+ir.Context.Queue.Endpoint)
	env = append(env, prefix+"accessKeyID="+ir.Context.Queue.AccessKey)
	env = append(env, prefix+"secretAccessKey="+ir.Context.Queue.SecretKey)

	return env, nil
}

func addAllSecrets(env []string, datasets []hlir.Dataset, ir llir.LLIR) ([]string, error) {
	var err error
	for _, d := range datasets {
		env, err = addSecret(env, d, ir)
		if err != nil {
			return env, err
		}
	}
	return env, nil
}

func addSecret(env []string, dataset hlir.Dataset, ir llir.LLIR) ([]string, error) {
	if dataset.S3.EnvFrom.Prefix != "" && dataset.S3.Rclone.RemoteName != "" {
		isValid, spec, err := queue.SpecFromRcloneRemoteName(dataset.S3.Rclone.RemoteName, "", "", 0)
		if err != nil {
			return env, err
		} else if !isValid {
			return env, fmt.Errorf("Invalid or missing rclone config for given remote=%s", dataset.S3.Rclone.RemoteName)
		}

		env = append(env, dataset.S3.EnvFrom.Prefix+"endpoint="+strings.Replace(spec.Endpoint, "$TEST_QUEUE_ENDPOINT", ir.Context.Queue.Endpoint, -1))
		env = append(env, dataset.S3.EnvFrom.Prefix+"accessKeyID="+spec.AccessKey)
		env = append(env, dataset.S3.EnvFrom.Prefix+"secretAccessKey="+spec.SecretKey)
	}

	return env, nil
}

func WritePid(file string, pid int) error {
	if err := os.WriteFile(file, []byte(strconv.Itoa(pid)), 0644); err != nil {
		return err
	}

	return nil
}

func killProcessGroupOnContextCancellation(ctx context.Context, cmd *exec.Cmd, opts build.LogOptions) {
	pgid, err := syscall.Getpgid(cmd.Process.Pid)
	if err != nil {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "Unable to get process group id for %d: %v\n", cmd.Process.Pid, err)
		}
		return
	}

	for {
		select {
		case <-ctx.Done():
			killProcessGroup(pgid, opts)
			return
		}
	}
}

func killProcessGroup(pgid int, opts build.LogOptions) {
	// note the minus sign
	if err := syscall.Kill(-pgid, 15); err != nil {
		if opts.Debug {
			fmt.Fprintf(os.Stderr, "Unable to kill process group %d: %v\n", pgid, err)
		}
	}
}
