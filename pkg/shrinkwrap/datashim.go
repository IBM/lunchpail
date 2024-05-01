package shrinkwrap

import (
	"fmt"
	"os"
	"os/exec"
)

func addDatashimNamespaceLabel(namespace string) error {
	cmd := exec.Command("kubectl", "label", "ns", namespace, "monitor-pods-datasets=enabled")
	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}

func waitForDatashimDeletion(namespace string, verbose bool) error {
	cmd := exec.Command("kubectl", "get", "crd", "datasetsinternal.com.ie.ibm.hpsys")
	if err := cmd.Run(); err == nil {
		if verbose {
			fmt.Fprintf(os.Stderr, "Waiting for datasets to be deleted...")
		}

		cmd := exec.Command("/bin/sh", "-c", "kubectl get --ignore-not-found -n "+namespace+" datasetinternal.com.ie.ibm.hpsys -o name | xargs -I{} -n1 kubectl wait --timeout=-1s -n "+namespace+" {} --for=delete")
		if err := cmd.Run(); err != nil {
			return err
		}

		if verbose {
			fmt.Fprintln(os.Stderr, "done")
		}
	}

	return nil
}
