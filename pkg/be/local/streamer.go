package local

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/nxadm/tail"
	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be/controller"
	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/events/utilization"
	"lunchpail.io/pkg/be/local/files"
	"lunchpail.io/pkg/be/streamer"
	"lunchpail.io/pkg/lunchpail"
)

type localStreamer struct {
	context.Context
	runname string
	backend Backend
}

// Return a streamer
func (backend Backend) Streamer(ctx context.Context, runname string) streamer.Streamer {
	return localStreamer{ctx, runname, backend}
}

func (s localStreamer) RunEvents() (chan events.Message, error) {
	c := make(chan events.Message)
	return c, nil
}

func (s localStreamer) RunComponentUpdates(cc chan events.ComponentUpdate, cm chan events.Message) error {
	pidsDir, err := files.PidfileDir(s.runname)
	if err != nil {
		return err
	}

	group, ctx := errgroup.WithContext(s.Context)
	runningLookup := make(map[string]bool)
	group.Go(func() error {
		ctrl := controller.Controller(nil)
		for {
			pidfiles, err := os.ReadDir(pidsDir)
			if err != nil && !errors.Is(err, os.ErrNotExist) {
				return err
			} else if err == nil {
				for _, pidfileEntry := range pidfiles {
					pidfile := pidfileEntry.Name()
					if files.IsMainPidfile(pidfile) {
						continue
					}

					runningNow, err := isPidRunning(filepath.Join(pidsDir, pidfile))
					if err != nil {
						return err
					}

					runningBefore, ok := runningLookup[pidfile]
					if !ok || runningBefore != runningNow {
						runningLookup[pidfile] = runningNow
						component, instanceName, err := files.ComponentForPidfile(pidfile)
						if err != nil {
							return err
						}

						// TODO infer events.Failed
						state := events.WorkerStatus(events.Running)
						event := events.EventType(events.Added)
						if !runningNow {
							state = events.Terminating
							event = events.Deleted
						}

						switch component {
						case lunchpail.WorkersComponent:
							dashIdx := strings.LastIndex(instanceName, "-")
							poolName := instanceName[:dashIdx]
							workerName := instanceName
							cc <- events.WorkerUpdate(workerName, "", poolName, ctrl, state, event)
						case lunchpail.WorkStealerComponent:
							cc <- events.WorkStealerUpdate("", ctrl, state, event)
						case lunchpail.DispatcherComponent:
							cc <- events.DispatcherUpdate("", ctrl, state, event)
						}
					}
				}
			}

			time.Sleep(1 * time.Second)

			select {
			case <-ctx.Done():
				return ctx.Err()
			}
		}
	})

	return nil
}

// Stream cpu and memory statistics
func (s localStreamer) Utilization(intervalSeconds int) (chan utilization.Model, error) {
	c := make(chan utilization.Model)
	return c, nil
}

// Stream queue statistics
func (s localStreamer) QueueStats(opts qstat.Options) (chan qstat.Model, error) {
	f, err := files.LogsForComponent(s.runname, lunchpail.WorkStealerComponent)
	if err != nil {
		return nil, err
	}

	tail, err := tailfChan(f, opts.Follow)
	if err != nil {
		return nil, err
	}

	c := make(chan qstat.Model)
	done := make(chan struct{})
	lines := make(chan string)

	errs, _ := errgroup.WithContext(s.Context)
	errs.Go(func() error {
		for line := range tail.Lines {
			if line.Err != nil {
				return line.Err
			}
			x := strings.Index(line.Text, "] ") // strip off prefix added by pipe.go
			lines <- line.Text[x+2:]
		}
		close(lines)

		<-done
		close(c)
		return nil
	})

	errs.Go(func() error {
		streamer.QstatFromChan(lines, c, done)
		return nil
	})

	return c, nil
}

// Stream logs from a given Component to os.Stdout
func (s localStreamer) ComponentLogs(c lunchpail.Component, taillines int, follow, verbose bool) error {
	logdir, err := files.LogDir(s.runname, false)
	if err != nil {
		return err
	}

	switch c {
	case lunchpail.WorkersComponent:
		fs, err := os.ReadDir(logdir)
		if err != nil {
			return err
		}
		group, _ := errgroup.WithContext(s.Context)
		for _, f := range fs {
			if strings.HasPrefix(f.Name(), "workerpool-") {
				group.Go(func() error { return tailf(filepath.Join(logdir, f.Name()), follow) })
			}
		}
		return group.Wait()
	default:
		// TODO allow caller to select stderr versus stdout
		group, _ := errgroup.WithContext(s.Context)
		group.Go(func() error { return tailf(filepath.Join(logdir, string(c)+".out"), follow) })
		group.Go(func() error { return tailf(filepath.Join(logdir, string(c)+".err"), follow) })
		return group.Wait()
	}
}

func tailfChan(outfile string, follow bool) (*tail.Tail, error) {
	return tail.TailFile(outfile, tail.Config{Follow: follow, ReOpen: follow})
}

func tailf(outfile string, follow bool) error {
	c, err := tailfChan(outfile, follow)
	if err != nil {
		return err
	}

	for line := range c.Lines {
		fmt.Println(line.Text)
	}

	return nil
}
