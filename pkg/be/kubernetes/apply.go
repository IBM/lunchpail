//go:build full || manage

package kubernetes

import (
	"io/ioutil"
	"os"
	"os/exec"
	"strings"

	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/ir/llir"
	util "lunchpail.io/pkg/util/yaml"
)

type Operation string

const (
	ApplyIt  Operation = "apply"
	DeleteIt           = "delete"
)

func apply(yaml, namespace, context string, operation Operation) error {
	yaml = strings.TrimSpace(yaml)
	if len(yaml) == 0 {
		// Nothing to do. If we don't short-circuit this path,
		// kubectl complains with "error: no objects passed to
		// apply".
		return nil
	}

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

func applyOperation(ir llir.LLIR, namespace, context string, operation Operation, cliOpts platform.CliOptions, verbose bool) error {
	opts, err := options(cliOpts)
	if err != nil {
		return err
	}

	yamls, err := MarshalAllComponents(ir, namespace, opts, verbose)
	if err != nil {
		return err
	}

	yaml := util.Join(yamls)
	if err := apply(yaml, namespace, context, operation); err != nil {
		return err
	}

	return nil
}
