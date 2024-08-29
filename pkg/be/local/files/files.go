package files

import (
	"fmt"
	"os"
	"path/filepath"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/lunchpail"
)

func lunchpailDir() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}

	return filepath.Join(dir, "lunchpail"), nil
}

func appsDir() (string, error) {
	dir, err := lunchpailDir()
	if err != nil {
		return "", err
	}

	return filepath.Join(dir, "apps"), nil
}

func thisAppDir() (string, error) {
	dir, err := appsDir()
	if err != nil {
		return "", err
	}

	return filepath.Join(dir, compilation.Name()), nil
}

func RunsDir() (string, error) {
	dir, err := thisAppDir()
	if err != nil {
		return "", err
	}

	return filepath.Join(dir, "runs"), nil
}

func runDir(runname string) (string, error) {
	dir, err := RunsDir()
	if err != nil {
		return "", err
	}

	//strings.Replace(runname, compilation.Name()+"-", "", 1),
	return filepath.Join(dir, runname), nil
}

func LogDir(runname string, mkdir bool) (string, error) {
	dir, err := runDir(runname)
	if err != nil {
		return "", err
	}

	logdir := filepath.Join(dir, "logs")

	if mkdir {
		return logdir, os.MkdirAll(logdir, 0755)
	}

	return logdir, nil
}

func LogsForComponent(runname string, c lunchpail.Component) (string, error) {
	dir, err := LogDir(runname, false)
	if err != nil {
		return "", err
	}

	if c == lunchpail.WorkersComponent {
		return "", fmt.Errorf("Invalid request for log file for workers")
	}

	return filepath.Join(dir, string(c)+".out"), nil
}

func componentsDir(runname string) (string, error) {
	dir, err := runDir(runname)
	if err != nil {
		return "", err
	}

	return filepath.Join(dir, "components"), nil
}

func PidfileForMain(runname string) (string, error) {
	dir, err := componentsDir(runname)
	if err != nil {
		return "", err
	}

	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}

	return filepath.Join(dir, "main.pid"), nil
}

func PidfileDir(runname string) (string, error) {
	return componentsDir(runname)
}

func Pidfile(runname, instanceName string, c lunchpail.Component, mkdir bool) (string, error) {
	dir, err := PidfileDir(runname)
	if err != nil {
		return "", err
	}

	if mkdir {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return "", err
		}
	}

	return filepath.Join(dir, string(c)+"-"+instanceName+".pid"), nil
}

func QueueFile(runname string) (string, error) {
	dir, err := runDir(runname)
	if err != nil {
		return "", err
	}

	return filepath.Join(dir, "queue.json"), nil
}
