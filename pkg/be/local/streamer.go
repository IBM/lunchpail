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

						var update events.ComponentUpdate
						switch component {
						case lunchpail.WorkersComponent:
							dashIdx := strings.LastIndex(instanceName, "-")
							poolName := instanceName[:dashIdx]
							workerName := instanceName
							update = events.WorkerUpdate(workerName, poolName, ctrl, state, event)
						case lunchpail.WorkStealerComponent:
							update = events.WorkStealerUpdate(ctrl, state, event)
						case lunchpail.DispatcherComponent:
							update = events.DispatcherUpdate(ctrl, state, event)
						}

						select {
						case <-ctx.Done():
							return ctx.Err()
						default:
							cc <- update
						}
					}
				}
			}

			time.Sleep(1 * time.Second)
		}
	})

	return nil
}

// Stream cpu and memory statistics
func (s localStreamer) Utilization(c chan utilization.Model, intervalSeconds int) error {
	return nil
}

// Stream queue statistics
func (s localStreamer) QueueStats(c chan qstat.Model, opts qstat.Options) error {
	f, err := files.LogsForComponent(s.runname, lunchpail.WorkStealerComponent)
	if err != nil {
		return err
	}

	tail, err := tailfChan(f, opts.Follow, opts.Verbose)
	if err != nil {
		return err
	}

	lines := make(chan string)
	errs, _ := errgroup.WithContext(s.Context)
	errs.Go(func() error {
		for line := range tail.Lines {
			if line.Err != nil {
				return line.Err
			}
			lines <- line.Text
		}
		close(lines)
		return nil
	})

	return streamer.QstatFromChan(s.Context, lines, c)
}

func (s localStreamer) watchForWorkerPools(logdir string, follow, verbose bool) error {
	watching := make(map[string]bool)
	group, _ := errgroup.WithContext(s.Context)

	// TODO fsnotify/fsnotify doesn't seem to work on macos
	for {
		fs, err := os.ReadDir(logdir)
		if err != nil {
			return err
		}

		for _, f := range fs {
			file := f.Name()
			if strings.HasPrefix(file, "workerpool-") {
				alreadyWatching, exists := watching[file]
				if !alreadyWatching || !exists {
					watching[file] = true
					group.Go(func() error {
						return tailf(filepath.Join(logdir, file), follow, verbose)
					})
				}
			}
		}

		running, err := isRunning(s.runname)
		if err != nil {
			return err
		} else if !running || !follow {
			break
		}

		select {
		case <-s.Context.Done():
			return nil
		default:
			time.Sleep(2 * time.Second)
		}
	}

	return group.Wait()
}

// Stream logs from a given Component to os.Stdout
func (s localStreamer) ComponentLogs(c lunchpail.Component, taillines int, follow, verbose bool) error {
	logdir, err := files.LogDir(s.runname, true)
	if err != nil {
		return err
	}

	switch c {
	case lunchpail.WorkersComponent:
		return s.watchForWorkerPools(logdir, follow, verbose)

	default:
		// TODO allow caller to select stderr versus stdout
		group, _ := errgroup.WithContext(s.Context)
		group.Go(func() error { return tailf(filepath.Join(logdir, string(c)+".out"), follow, verbose) })
		group.Go(func() error { return tailf(filepath.Join(logdir, string(c)+".err"), follow, verbose) })
		return group.Wait()
	}
}

func tailfChan(outfile string, follow, verbose bool) (*tail.Tail, error) {
	Logger := tail.DiscardingLogger
	if verbose {
		// this tells tailf to use its default logger
		Logger = nil
	}

	return tail.TailFile(outfile, tail.Config{Follow: follow, ReOpen: follow, Logger: Logger})
}

func tailf(outfile string, follow, verbose bool) error {
	c, err := tailfChan(outfile, follow, verbose)
	if err != nil {
		return err
	}

	for line := range c.Lines {
		fmt.Println(line.Text)
	}

	return nil
}
