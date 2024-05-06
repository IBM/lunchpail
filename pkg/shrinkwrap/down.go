package shrinkwrap

import (
	"fmt"
	"github.com/mittwald/go-helm-client"
	"io/ioutil"
	"lunchpail.io/pkg/lunchpail"
	"os"
	"os/exec"
	"strings"
	"time"
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

func uninstall(client helmclient.Client, releaseName, namespace string) error {
	return client.UninstallRelease(&helmclient.ChartSpec{ReleaseName: releaseName, Namespace: namespace, Wait: true, KeepHistory: false, Timeout: 240 * time.Second})
}

func Down(opts DownOptions) error {
	namespace := lunchpail.AssembledAppName()
	if opts.Namespace != "" {
		namespace = opts.Namespace
	}

	outputOfHelmCmd := ioutil.Discard
	if opts.Verbose {
		outputOfHelmCmd = os.Stdout
	}

	fmt.Fprintf(os.Stderr, "Uninstalling application in namespace=%s\n", namespace)

	helmClient, err := helmclient.New(&helmclient.Options{
		Output:    outputOfHelmCmd,
		Namespace: namespace,
	})
	if err != nil {
		return err
	}

	if err := uninstall(helmClient, "lunchpail-app", namespace); err != nil {
		if !strings.Contains(err.Error(), "not found") {
			return err
		} else {
			// TODO: do we need an --ignore-not-found behavior?
			fmt.Fprintf(os.Stderr, "Warning: application not installed\n")
		}
	}

	if err := uninstall(helmClient, "lunchpail-core", namespace); err != nil {
		if !strings.Contains(err.Error(), "not found") {
			return err
		} else {
			// TODO: do we need an --ignore-not-found behavior?
			fmt.Fprintf(os.Stderr, "Warning: core not installed\n")
		}
	}

	if err := deleteNamespace(namespace); err != nil {
		return err
	}

	return nil
}
