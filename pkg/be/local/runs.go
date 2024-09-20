package local

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strconv"

	"github.com/shirou/gopsutil/v4/process"

	"lunchpail.io/pkg/be/local/files"
	"lunchpail.io/pkg/be/runs"
	"lunchpail.io/pkg/lunchpail"
)

// List deployed runs
func (backend Backend) ListRuns(ctx context.Context, all bool) ([]runs.Run, error) {
	runsdir, err := files.RunsDir()
	if err != nil {
		return nil, err
	}

	entries, err := os.ReadDir(runsdir)
	if err != nil {
		// TODO distinguish directory non-existence from other errors
		return []runs.Run{}, nil
	}

	L := []runs.Run{}
	for _, e := range entries {
		info, err := e.Info()
		if err != nil {
			return nil, err
		}

		runname := e.Name()

		running := true
		if !all {
			if r, err := isRunning(runname); err != nil {
				return nil, err
			} else {
				running = r
			}
		}

		if running {
			L = append(L, runs.Run{Name: e.Name(), CreationTimestamp: info.ModTime()})
		}
	}

	return L, nil
}

func isRunning(runname string) (bool, error) {
	pidfile, err := files.PidfileForMain(runname)
	if err != nil {
		return false, err
	}

	return isPidRunning(pidfile)
}

func isPidRunning(pidfile string) (bool, error) {
	pidb, err := os.ReadFile(pidfile)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			// pid file doesn't exist, so not running!
			return false, nil
		} else {
			return false, err
		}
	}

	pid64, err := strconv.ParseInt(string(pidb), 10, 32)
	if err != nil {
		return false, err
	}
	pid := int32(pid64)
	// TODO O(N*M)? should we factor out a single call to gopsutil.Pids()?
	return process.PidExists(pid)
}

type Part struct {
	Component    lunchpail.Component
	InstanceName string
}
type Parts = map[int32]Part

func partsOfRun(runname string) (Parts, error) {
	dir, err := files.PidfileDir(runname)
	if err != nil {
		return nil, err
	}

	pidfiles, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	m := make(Parts)
	for _, pidfile := range pidfiles {
		if files.IsMainPidfile(pidfile.Name()) {
			continue
		}

		component, instanceName, err := files.ComponentForPidfile(pidfile.Name())
		if err != nil {
			return nil, err
		}

		b, err := os.ReadFile(filepath.Join(dir, pidfile.Name()))
		if err != nil {
			return nil, err
		}

		i, err := strconv.ParseInt(string(b), 10, 32)
		if err != nil {
			return nil, err
		}

		m[int32(i)] = Part{Component: component, InstanceName: instanceName}
	}

	return m, nil
}
