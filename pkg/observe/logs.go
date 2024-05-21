package shrinkwrap

import (
	"context"
	"fmt"
	"os"
	"os/exec"

	"golang.org/x/sync/errgroup"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/observe/runs"
)

type LogsOptions struct {
	Namespace  string
	Follow     bool
	Verbose    bool
	Components []lunchpail.Component
}

func streamLogs(runname, namespace string, component lunchpail.Component, follow bool, verbose bool) error {
	containers := "app"
	appSelector := ",app.kubernetes.io/instance=" + runname
	if component == lunchpail.DispatcherComponent {
		containers = "main"
		// FIXME: the workdispatcher has an invalid part-of
		appSelector = ""
	} else if component == lunchpail.WorkStealerComponent {
		containers = "workstealer"
	} else if component == lunchpail.RuntimeComponent {
		containers = "controller"
		appSelector = ""
	} else if component == lunchpail.WorkersComponent {
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

func Logs(runnameIn string, opts LogsOptions) error {
	_, runname, namespace, err := runs.WaitForRun(runnameIn, opts.Namespace, true)
	if err != nil {
		return err
	}

	group, _ := errgroup.WithContext(context.Background())

	for _, component := range opts.Components {
		group.Go(func() error {
			return streamLogs(runname, namespace, component, opts.Follow, opts.Verbose)
		})
	}

	return group.Wait()
}
