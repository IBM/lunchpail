package shell

import (
	"errors"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"

	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func stage(c llir.ShellComponent) (string, string, error) {
	workdir, err := ioutil.TempDir("", "lunchpail")
	if err != nil {
		return "", "", err
	}

	for _, code := range c.Application.Spec.Code {
		if err := saveToWorkdir(workdir, code); err != nil {
			return "", "", err
		}
	}

	command := c.Application.Spec.Command
	//command = strings.Replace(command, "/workdir/lunchpail", os.Args[0] + " ", 1)
	//if strings.HasPrefix(command, "lunchpail") {
	//command = strings.Replace(command, "lunchpail", os.Args[0] + " ", 1)
	//}

	// hmm, hacky attempts to get intrinsic prereqs
	switch c.C() {
	case lunchpail.MinioComponent:
		if err := ensureMinio(); err != nil {
			return "", "", err
		}
	}

	return workdir, command, nil
}

func saveToWorkdir(workdir string, code hlir.Code) error {
	return os.WriteFile(filepath.Join(workdir, code.Name), []byte(code.Source), 0700)
}

func ensureMinio() error {
	if err := setenvForMinio(); err != nil {
		return err
	}

	if _, err := exec.LookPath("minio"); err != nil {
		if errors.Is(err, exec.ErrNotFound) {
			return installMinio()
		} else if err != nil {
			return err
		}
	}

	return nil
}
