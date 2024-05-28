package kubernetes

import (
	"io/ioutil"
	"lunchpail.io/pkg/ir/llir"
	"os"
	"os/exec"
)

type Operation string

const (
	ApplyIt  Operation = "apply"
	DeleteIt           = "delete"
)

func apply(yaml, namespace, context string, operation Operation) error {
	file, err := ioutil.TempFile("", "lunchpail")
	if err != nil {
		return err
	}
	defer os.Remove(file.Name())

	if err := os.WriteFile(file.Name(), []byte(yaml), 0644); err != nil {
		return err
	}

	args := []string{string(operation), "-f", file.Name(), "-n", namespace}

	if namespace != "" {
		args = append(args, "-n="+namespace)
	}
	if context != "" {
		args = append(args, "--context="+context)
	}

	switch operation {
	case ApplyIt:
		// args = append(args, "--server-side")
	case DeleteIt:
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

func ApplyOperation(ir llir.LLIR, namespace, context string, operation Operation) error {
	yamls := ir.Yamlset()
	for idx := range yamls {
		if operation == DeleteIt {
			// delete in reverse order of apply
			idx = len(yamls) - 1 - idx
		}
		if err := apply(yamls[idx].Yaml, namespace, yamls[idx].Context, operation); err != nil {
			return err
		}
	}
	return nil
}

func Apply(ir llir.LLIR, namespace, context string) error {
	return ApplyOperation(ir, namespace, context, ApplyIt)
}

func Delete(yaml, namespace, context string) error {
	return apply(yaml, namespace, context, DeleteIt)
}
