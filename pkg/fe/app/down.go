package app

import (
	"context"
	"fmt"
	"golang.org/x/sync/errgroup"
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/observe/runs"
	"os"
	"os/exec"
)

type DownOptions struct {
	Namespace string
	Verbose   bool
}

func deleteNamespace(namespace string) error {
	fmt.Fprintf(os.Stderr, "Removing namespace=%s...", namespace)

	cmd := exec.Command("kubectl", "delete", "ns", namespace)
	if err := cmd.Run(); err != nil {
		return err
	}
	fmt.Fprintln(os.Stderr, "done")

	return nil
}

func deleteNormalStuff(runname, namespace string) error {
	group, _ := errgroup.WithContext(context.Background())

	group.Go(func() error {
		return deleteStuff(runname, namespace, "jobs.batch")
	})
	group.Go(func() error {
		return deleteStuff(runname, namespace, "persistentvolume")
	})
	group.Go(func() error {
		return deleteStuff(runname, namespace, "persistentvolumeclaim")
	})
	group.Go(func() error {
		return deleteStuff(runname, namespace, "deployments.app")
	})
	group.Go(func() error {
		return deleteStuff(runname, namespace, "secret")
	})
	group.Go(func() error {
		return deleteStuff(runname, namespace, "configmap")
	})
	group.Go(func() error {
		return deleteStuff(runname, namespace, "serviceaccount")
	})

	// we have some non-deployment pods
	group.Go(func() error {
		return deleteStuff(runname, namespace, "pods")
	})

	return group.Wait()
}

func deleteStuff(runname, namespace, kind string) error {
	cmd := exec.Command("/bin/sh", "-c", "kubectl get "+kind+" -o name -n "+namespace+" -l app.kubernetes.io/instance="+runname+" | xargs kubectl delete --ignore-not-found -n "+namespace)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}

func deleteAllStuff(runname, namespace string) error {
	return deleteNormalStuff(runname, namespace)
}

func Down(runname string, opts DownOptions) error {
	appname := lunchpail.AssembledAppName()
	namespace := appname
	if opts.Namespace != "" {
		namespace = opts.Namespace
	}

	//	alsoDeleteNamespace := false

	if runname == "" {
		singletonRun, err := runs.Singleton(appname, namespace)
		if err != nil {
			return err
		}
		runname = singletonRun.Name
		//		alsoDeleteNamespace = true
	}

	if err := deleteAllStuff(runname, namespace); err != nil {
		return err
	}

	//	if alsoDeleteNamespace {
	//		if err := deleteNamespace(namespace); err != nil {
	//			return err
	//		}
	//	}

	return nil
}
