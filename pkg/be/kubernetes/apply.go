package kubernetes

import (
	"io/ioutil"
	"os"
	"os/exec"
)

type Operation string

const (
	applyOp  Operation = "apply"
	deleteOp           = "delete"
)

func apply(yaml, namespace string, operation Operation) error {
	file, err := ioutil.TempFile("", "lunchpail")
	if err != nil {
		return err
	}
	defer os.Remove(file.Name())

	if err := os.WriteFile(file.Name(), []byte(yaml), 0644); err != nil {
		return err
	}

	extra := ""
	n := 2
	switch operation {
	case applyOp:
		extra = "--server-side"
	case deleteOp:
		extra = "--ignore-not-found"
		n = 1
	}

	// temporarily... while we still have CRDs, we may need to apply twice to get the crds in place
	var applyerr error
	for range n {
		cmd := exec.Command("kubectl", string(operation), extra, "-f", file.Name(), "-n", namespace)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		applyerr = cmd.Run()
		if applyerr == nil {
			break
		}
	}

	return applyerr
}

func Apply(yaml, namespace string) error {
	return apply(yaml, namespace, applyOp)
}

func Delete(yaml, namespace string) error {
	return apply(yaml, namespace, deleteOp)
}
