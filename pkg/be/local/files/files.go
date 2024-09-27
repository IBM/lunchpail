package files

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"lunchpail.io/pkg/build"
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

	return filepath.Join(dir, build.Name()), nil
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

	//strings.Replace(runname, build.Name()+"-", "", 1),
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

func LogFileForComponent(c lunchpail.Component) string {
	return lunchpail.ComponentShortName(c)
}

func LogsForComponent(runname string, c lunchpail.Component) (string, error) {
	dir, err := LogDir(runname, false)
	if err != nil {
		return "", err
	}

	if c == lunchpail.WorkersComponent {
		return "", fmt.Errorf("Invalid request for log file for workers")
	}

	return filepath.Join(dir, LogFileForComponent(c)+".out"), nil
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

func IsMainPidfile(pidfile string) bool {
	return pidfile == "main.pid"
}

func PidfileDir(runname string) (string, error) {
	return componentsDir(runname)
}

func ComponentForPidfile(pidfile string) (lunchpail.Component, string, error) {
	idx := strings.Index(pidfile, "-")
	if idx < 0 {
		return lunchpail.Component(""), "", fmt.Errorf("Invalid pidfile in ComponentForPidFile: %s", pidfile)
	}

	p := strings.TrimSuffix(pidfile[idx+1:], ".pid")
	c, err := lunchpail.LookupComponent(pidfile[:idx])
	if err != nil {
		return c, p, err
	}

	switch c {
	case lunchpail.MinioComponent, lunchpail.WorkStealerComponent, lunchpail.DispatcherComponent, lunchpail.WorkersComponent:
		return c, p, nil
	default:
		return c, p, fmt.Errorf("Unknown component in ComponentForPidfile: %v", c)
	}
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
