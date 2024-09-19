package shell

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"lunchpail.io/pkg/be/local/files"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

func Spawn(ctx context.Context, c llir.ShellComponent, q llir.Queue, runname, logdir string, verbose bool) error {
	pidfile, err := files.Pidfile(runname, c.InstanceName, c.C(), true)
	if err != nil {
		return err
	}

	workdir, command, err := stage(c)
	if err != nil {
		return err
	}

	// tee command output to the logdir
	instance := strings.Replace(c.InstanceName, runname, "", 1)
	logfile := string(c.C())
	if len(instance) > 0 {
		logfile = logfile + "-" + instance
	}

	if verbose {
		fmt.Fprintf(os.Stderr, "Launching process with commandline: %s\n", command)
	}

	cmd := exec.CommandContext(ctx, "/bin/sh", "-c", command)
	cmd.Dir = workdir

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

	if env, err := addEnv(c, q); err != nil {
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

	return cmd.Wait()
}

func addEnv(c llir.ShellComponent, q llir.Queue) ([]string, error) {
	var err error
	var absPathToThisExe string
	absPathToThisExe, err = filepath.Abs(os.Args[0])
	if err != nil {
		return nil, err
	}

	// TODO: how much of user's env do we really want to expose? maybe just PATH?
	env := []string{
		"PATH=" + os.Getenv("PATH"),
		"LUNCHPAIL_COMPONENT=" + string(c.C()),
		"LUNCHPAIL_EXE=" + absPathToThisExe,
		"LUNCHPAIL_QUEUE_PATH=" + c.QueuePrefixPath,
		"LUNCHPAIL_POD_NAME=" + c.InstanceName,
		"TEST_QUEUE_ENDPOINT=" + q.Endpoint,
		"LUNCHPAIL_TARGET=local",
	}

	env, err = addAppEnv(env, c)
	if err != nil {
		return env, err
	}

	env, err = addQueueEnv(env, q)
	if err != nil {
		return env, err
	}

	return addAllSecrets(env, c.Application.Spec.Datasets, q)
}

func addAppEnv(env []string, c llir.ShellComponent) ([]string, error) {
	for k, v := range c.Application.Spec.Env {
		env = append(env, k+"="+v)
	}

	return env, nil
}

func addQueueEnv(env []string, q llir.Queue) ([]string, error) {
	prefix := "lunchpail_queue_" // TODO share with be/kubernetes/shell.envForQueue()

	env = append(env, prefix+"endpoint="+q.Endpoint)
	env = append(env, prefix+"accessKeyID="+q.AccessKey)
	env = append(env, prefix+"secretAccessKey="+q.SecretKey)

	return env, nil
}

func addAllSecrets(env []string, datasets []hlir.Dataset, q llir.Queue) ([]string, error) {
	var err error
	for _, d := range datasets {
		env, err = addSecret(env, d, q)
		if err != nil {
			return env, err
		}
	}
	return env, nil
}

func addSecret(env []string, dataset hlir.Dataset, q llir.Queue) ([]string, error) {
	if dataset.S3.EnvFrom.Prefix != "" && dataset.S3.Rclone.RemoteName != "" {
		isValid, spec, err := queue.SpecFromRcloneRemoteName(dataset.S3.Rclone.RemoteName, "", "", 0)
		if err != nil {
			return env, err
		} else if !isValid {
			return env, fmt.Errorf("Invalid or missing rclone config for given remote=%s", dataset.S3.Rclone.RemoteName)
		}

		env = append(env, dataset.S3.EnvFrom.Prefix+"endpoint="+strings.Replace(spec.Endpoint, "$TEST_QUEUE_ENDPOINT", q.Endpoint, -1))
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
