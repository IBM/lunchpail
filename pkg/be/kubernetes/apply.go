package kubernetes

import (
	"io/ioutil"
	"lunchpail.io/pkg/ir"
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

	args := []string{string(operation), "-f", file.Name(), "-n", namespace}
	switch operation {
	case applyOp:
		// args = append(args, "--server-side")
	case deleteOp:
		args = append(args, "--ignore-not-found")
	}

	// The yaml may be self-referential, e.g. it may include a
	// namespace spec and also use that namespace spec; same for
	// service accounts. Thus, we may need to apply twice (n=2)
	cmd := exec.Command("kubectl", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func Apply(ir ir.LLIR, namespace string) error {
	for _, yaml := range ir.Yamlset() {
		if err := apply(yaml, namespace, applyOp); err != nil {
			return err
		}
	}
	return nil
}

func Delete(yaml, namespace string) error {
	return apply(yaml, namespace, deleteOp)
}
