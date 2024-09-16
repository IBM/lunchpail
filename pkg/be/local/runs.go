package local

import (
	"context"
	"os"
	"strconv"

	"github.com/shirou/gopsutil/v4/process"

	"lunchpail.io/pkg/be/local/files"
	"lunchpail.io/pkg/be/runs"
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

		include := all
		if !include {
			running, err := isRunning(runname)
			if err != nil {
				return nil, err
			} else if running {
				L = append(L, runs.Run{Name: e.Name(), CreationTimestamp: info.ModTime()})
			}
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
		return false, err
	}

	pid64, err := strconv.ParseInt(string(pidb), 10, 32)
	if err != nil {
		return false, err
	}
	pid := int32(pid64)
	// TODO O(N*M)? should we factor out a single call to gopsutil.Pids()?
	return process.PidExists(pid)
}
