package cpu

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/runs"
)

type CpuOptions struct {
	Namespace string
	Watch     bool
	Verbose   bool
}

func UI(opts CpuOptions) error {
	appname := lunchpail.AssembledAppName()
	namespace := appname
	if opts.Namespace != "" {
		namespace = opts.Namespace
	}

	run, err := runs.Singleton(appname, namespace)
	if err != nil {
		return err
	}

	selector := "app.kubernetes.io/component=workerpool,app.kubernetes.io/instance=" + run.Name + ",app.kubernetes.io/part-of=" + appname
	cmdline := "kubectl get pod -l " + selector + " -n " + namespace + " -oname|xargs -I{} -n1 -P99 kubectl exec {} -c app -n " + namespace + " -- bash -c 'cd /sys/fs/cgroup;f=cpu/cpuacct.usage;if [ -f $f ]; then s=1000000000;b=$(cat $f);sleep 1;e=$(cat $f);else f=cpu.stat;s=1000000;b=$(cat $f|head -1|cut -d\" \" -f2);sleep 1;e=$(cat $f|head -1|cut -d\" \" -f2);fi;printf \"$(hostname) %.2f\\n\" $(echo \"($e-$b)/($s)*100\"|bc -l)'|sort -k2 -rn|while read name pct; do ppct=\"\\e[1;36m$pct%%\\e[0m\"; printf \"$name\\t$ppct\\n\";done"

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "cmdline: %s\n", cmdline)
	}

	dir := ""
	if opts.Watch {
		tmpfile, err := os.CreateTemp("", "cpu")
		if err != nil {
			return err
		} else {
			// defer os.Remove(tmpfile.Name())
		}
		if err := os.WriteFile(tmpfile.Name(), []byte(cmdline), 0755); err != nil {
			return err
		}

		if err := os.Chmod(tmpfile.Name(), 0755); err != nil {
			return err
		}

		dir = filepath.Dir(tmpfile.Name())
		cmdline = "watch -c -t ./" + filepath.Base(tmpfile.Name())
	}

	cmd := exec.Command("/bin/sh", "-c", cmdline)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if dir != "" {
		cmd.Dir = dir
	}

	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}
