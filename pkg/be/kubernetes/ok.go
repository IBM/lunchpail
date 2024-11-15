package kubernetes

import (
	"context"
	"fmt"
	"os"
	"time"

	"k8s.io/client-go/discovery"
	"k8s.io/client-go/tools/clientcmd"

	"lunchpail.io/pkg/build"
	initialize "lunchpail.io/pkg/lunchpail/init"
)

func (backend Backend) Ok(ctx context.Context, initOk bool, opts build.Options) error {
	announcedWait := false
	for {
		if err := backend.ok(ctx, initOk, opts); err != nil {
			if !initOk && clientcmd.IsEmptyConfig(err) {
				if !announcedWait {
					announcedWait = true
					fmt.Println("Waiting for Kubernetes cluster. Hit ctrl+c to cancel.")
				}
				time.Sleep(1 * time.Second)
				continue
			}

			return err
		}

		break
	}

	return nil
}

func (backend Backend) ok(ctx context.Context, initOk bool, opts build.Options) error {
	_, config, err := Client()
	if err != nil {
		if clientcmd.IsEmptyConfig(err) && initOk {
			if ok, buildImages := userIsOkWithInit(); ok {
				if opts.Log.Verbose {
					fmt.Fprintln(os.Stderr, "Intializing local Kubernetes cluster", os.Args)
				}
				return initialize.Local(ctx, initialize.InitLocalOptions{BuildImages: buildImages, Verbose: opts.Log.Verbose})
			}
			return err
		}

		return err
	}

	discoveryClient, err := discovery.NewDiscoveryClientForConfig(config)
	if err != nil {
		return err
	}

	if _, err := discoveryClient.ServerVersion(); err != nil {
		return err
	}

	return nil
}

func userIsOkWithInit() (bool, bool) {
	// TODO: add --yes cli option?
	if os.Getenv("CI") != "" || os.Getenv("RUNNING_LUNCHPAIL_TESTS") != "" {
		return true, true
	}

	var answer string
	fmt.Println("No Kubernetes configuration found. Would you like to initialize a cluster locally? (yes/no)")
	fmt.Scanln(&answer)
	return answer == "yes", false
}
