package observe

import (
	"context"
	"fmt"
	"os"
	"os/exec"

	"golang.org/x/sync/errgroup"
	comp "lunchpail.io/pkg/lunchpail"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/be/runs/util"
)

type LogsOptions struct {
	Namespace  string
	Follow     bool
	Verbose    bool
	Components []comp.Component
}

func streamLogs(runname, namespace string, component comp.Component, follow bool, verbose bool) error {
	containers := "app"
	appSelector := ",app.kubernetes.io/instance=" + runname
	if component == comp.DispatcherComponent {
		containers = "main"
		// FIXME: the workdispatcher has an invalid part-of
		appSelector = ""
	} else if component == comp.WorkStealerComponent {
		containers = "workstealer"
	} else if component == comp.WorkersComponent {
		appSelector = ""
	}

	followFlag := ""
	if follow {
		followFlag = "-f"
	}

	selector := "app.kubernetes.io/component=" + string(component) + appSelector
	cmdline := "kubectl logs -n " + namespace + " -l " + selector + " --tail=-1 " + followFlag + " -c " + containers + " --max-log-requests=99 | grep -v 'workerpool worker'"

	if verbose {
		fmt.Fprintf(os.Stderr, "Tracking logs of component=%s\n", component)
		fmt.Fprintf(os.Stderr, "Tracking logs via cmdline=%s\n", cmdline)
	}

	cmd := exec.Command("/bin/sh", "-c", cmdline)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}

func Logs(runnameIn string, backend be.Backend, opts LogsOptions) error {
	_, runname, err := util.WaitForRun(runnameIn, true, backend)
	if err != nil {
		return err
	}

	group, _ := errgroup.WithContext(context.Background())

	for _, component := range opts.Components {
		group.Go(func() error {
			return streamLogs(runname, opts.Namespace, component, opts.Follow, opts.Verbose) // fixme Namespace
		})
	}

	return group.Wait()
}
