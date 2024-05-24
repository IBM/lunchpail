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

	n := 1
	args := []string{string(operation), "-f", file.Name(), "-n", namespace}
	switch operation {
	case applyOp:
		// args = append(args, "--server-side")
		n = 2 // see the comment below re: n=2
	case deleteOp:
		args = append(args, "--ignore-not-found")
	}

	// The yaml may be self-referential, e.g. it may include a
	// namespace spec and also use that namespace spec; same for
	// service accounts. Thus, we may need to apply twice (n=2)
	var applyerr error
	for range n {
		cmd := exec.Command("kubectl", args...)
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
