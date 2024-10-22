package files

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
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

func runDir(run queue.RunContext) (string, error) {
	dir, err := RunsDir()
	if err != nil {
		return "", err
	}

	//strings.Replace(runname, build.Name()+"-", "", 1),
	return filepath.Join(dir, run.RunName, "step", fmt.Sprintf("%d", run.Step)), nil
}

func LogDir(run queue.RunContext, mkdir bool) (string, error) {
	dir, err := runDir(run)
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

func LogsForComponent(run queue.RunContext, c lunchpail.Component) (string, error) {
	dir, err := LogDir(run, false)
	if err != nil {
		return "", err
	}

	if c == lunchpail.WorkersComponent {
		return "", fmt.Errorf("Invalid request for log file for workers")
	}

	return filepath.Join(dir, LogFileForComponent(c)+".out"), nil
}

func componentsDir(run queue.RunContext) (string, error) {
	dir, err := runDir(run)
	if err != nil {
		return "", err
	}

	return filepath.Join(dir, "components"), nil
}

func PidfileForMain(run queue.RunContext) (string, error) {
	dir, err := componentsDir(run)
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

func PidfileDir(run queue.RunContext) (string, error) {
	return componentsDir(run)
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

func Pidfile(run queue.RunContext, instanceName string, c lunchpail.Component, mkdir bool) (string, error) {
	dir, err := PidfileDir(run)
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

func QueueFile(run queue.RunContext) (string, error) {
	dir, err := runDir(run)
	if err != nil {
		return "", err
	}

	return filepath.Join(dir, "queue.json"), nil
}
