package boot

import (
	"context"
	"fmt"

	"golang.org/x/sync/errgroup"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/be/ibmcloud"
	"lunchpail.io/pkg/be/kubernetes"
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/fe/linker"
	"lunchpail.io/pkg/observe/runs"
)

type DownOptions struct {
	Namespace            string
	Verbose              bool
	DeleteNamespace      bool
	DeleteAll            bool
	TargetPlatform       platform.Platform
	ApiKey               string
	DeleteCloudResources bool
}

func deleteNamespace(namespace string) error {
	clientset, _, err := kubernetes.Client()
	if err != nil {
		return err
	}

	api := clientset.CoreV1().Namespaces()
	if err := api.Delete(context.Background(), namespace, metav1.DeleteOptions{}); err != nil {
		return err
	}
	fmt.Printf("namespace \"%s\" deleted\n", namespace)
	return nil
}

func tryDeleteNamespace(assemblyName, namespace string) error {
	remainingRuns, err := runs.List(assemblyName, namespace)
	if err != nil {
		return err
	} else if len(remainingRuns) != 0 {
		return fmt.Errorf("Non-empty namespace %s still has %d runs:\n%s", namespace, len(remainingRuns), runs.Pretty(remainingRuns))
	} else if err := deleteNamespace(namespace); err != nil {
		return err
	}

	return nil
}

func DownList(runnames []string, opts DownOptions) error {
	assemblyName, namespace := nans(opts)
	deleteNs := opts.DeleteNamespace

	if len(runnames) == 0 {
		if opts.DeleteAll {
			remainingRuns, err := runs.List(assemblyName, namespace)
			if err != nil {
				return err
			}
			for _, run := range remainingRuns {
				runnames = append(runnames, run.Name)
			}
			opts.DeleteNamespace = false
		} else {
			// then the user didn't specify a run. pass "" which
			// will activate the logic that looks for a singleton
			// run in the given namespace
			return Down("", opts)
		}
	}

	// otherwise, Down all of the runs in the given list
	group, _ := errgroup.WithContext(context.Background())
	for _, runname := range runnames {
		group.Go(func() error { return Down(runname, opts) })
	}
	if err := group.Wait(); err != nil {
		return err
	}

	if deleteNs {
		if err := tryDeleteNamespace(assemblyName, namespace); err != nil {
			return err
		}
	}

	return nil
}

func nans(opts DownOptions) (string, string) {
	assemblyName := assembly.Name()
	namespace := assemblyName
	if opts.Namespace != "" {
		namespace = opts.Namespace
	}

	return assemblyName, namespace
}

func Down(runname string, opts DownOptions) error {
	assemblyName, namespace := nans(opts)

	if runname == "" {
		singletonRun, err := runs.Singleton(assemblyName, namespace)
		if err != nil {
			return err
		}
		runname = singletonRun.Name
	}

	assemblyOptions := assembly.Options{}
	assemblyOptions.Namespace = opts.Namespace
	assemblyOptions.TargetPlatform = opts.TargetPlatform
	assemblyOptions.ApiKey = opts.ApiKey
	configureOptions := linker.ConfigureOptions{}
	configureOptions.AssemblyOptions = assemblyOptions
	configureOptions.Verbose = opts.Verbose

	upOptions := UpOptions{}
	upOptions.ConfigureOptions = configureOptions
	upOptions.UseThisRunName = runname

	var action ibmcloud.Action
	if opts.DeleteCloudResources {
		action = ibmcloud.Delete
	} else {
		action = ibmcloud.Stop
	}
	if err := upDown(upOptions, kubernetes.DeleteIt, action); err != nil {
		return err
	}

	if opts.DeleteNamespace {
		if err := tryDeleteNamespace(assemblyName, namespace); err != nil {
			return err
		}
	}

	return nil
}
