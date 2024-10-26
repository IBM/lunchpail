package local

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/nxadm/tail"
	"github.com/shirou/gopsutil/v4/process"
	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be/controller"
	"lunchpail.io/pkg/be/events"
	"lunchpail.io/pkg/be/events/qstat"
	"lunchpail.io/pkg/be/events/utilization"
	"lunchpail.io/pkg/be/local/files"
	"lunchpail.io/pkg/be/streamer"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/lunchpail"
)

type localStreamer struct {
	context.Context
	run     queue.RunContext
	backend Backend
}

// Return a streamer
func (backend Backend) Streamer(ctx context.Context, run queue.RunContext) streamer.Streamer {
	return localStreamer{ctx, run, backend}
}

func (s localStreamer) RunEvents() (chan events.Message, error) {
	c := make(chan events.Message)
	return c, nil
}

func (s localStreamer) RunComponentUpdates(cc chan events.ComponentUpdate, cm chan events.Message) error {
	pidsDir, err := files.PidfileDir(s.run)
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
	for {
		ps, err := process.ProcessesWithContext(s.Context)
		if err != nil {
			return err
		}

		var m utilization.Model

		parts, err := partsOfRun(s.run.RunName)
		if err != nil {
			return err
		}

		for _, p := range ps {
			part, ok := parts[p.Pid]
			if !ok {
				continue
			}

			worker := utilization.Worker{Name: part.InstanceName, Component: part.Component}
			cpu, err := p.CPUPercentWithContext(s.Context)
			if err != nil {
				return err
			}
			worker.CpuUtil = cpu

			mem, err := p.MemoryInfoWithContext(s.Context)
			if err != nil {
				return err
			}
			worker.MemoryBytes = mem.RSS

			m.Workers = append(m.Workers, worker)
		}

		if len(m.Workers) > 0 {
			c <- m
		}

		select {
		case <-s.Context.Done():
			return nil
		default:
			time.Sleep(time.Duration(intervalSeconds) * time.Second)
		}
	}
}

// Stream queue statistics
func (s localStreamer) QueueStats(c chan qstat.Model, opts qstat.Options) error {
	f, err := files.LogsForComponent(s.run, lunchpail.WorkStealerComponent)
	if err != nil {
		return err
	}

	tail, err := tailfChan(f, streamer.LogOptions{Follow: opts.Follow, Verbose: opts.Verbose})
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

func (s localStreamer) watchForWorkerPools(logdir string, opts streamer.LogOptions) error {
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
			if strings.HasPrefix(file, lunchpail.ComponentShortName(lunchpail.WorkersComponent)) {
				alreadyWatching, exists := watching[file]
				if !alreadyWatching || !exists {
					watching[file] = true
					group.Go(func() error {
						return tailf(filepath.Join(logdir, file), opts)
					})
				}
			}
		}

		runStillGoing, err := isRunning(s.run.RunName)
		if err != nil {
			return err
		} else if !runStillGoing || !opts.Follow {
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
func (s localStreamer) ComponentLogs(c lunchpail.Component, opts streamer.LogOptions) error {
	logdir, err := files.LogDir(s.run, true)
	if err != nil {
		return err
	}

	switch c {
	case lunchpail.WorkersComponent:
		return s.watchForWorkerPools(logdir, opts)

	default:
		// TODO allow caller to select stderr versus stdout
		group, _ := errgroup.WithContext(s.Context)
		group.Go(func() error { return tailf(filepath.Join(logdir, files.LogFileForComponent(c)+".out"), opts) })
		group.Go(func() error { return tailf(filepath.Join(logdir, files.LogFileForComponent(c)+".err"), opts) })
		return group.Wait()
	}
}

func tailfChan(outfile string, opts streamer.LogOptions) (*tail.Tail, error) {
	Logger := tail.DiscardingLogger
	if opts.Verbose {
		Logger = log.New(os.Stderr, "", log.LstdFlags)
	}

	return tail.TailFile(outfile, tail.Config{Follow: opts.Follow, ReOpen: opts.Follow, Logger: Logger})
}

func tailf(outfile string, opts streamer.LogOptions) error {
	c, err := tailfChan(outfile, opts)
	if err != nil {
		return err
	}

	writer := os.Stdout
	if filepath.Ext(outfile) == ".err" {
		writer = os.Stderr
	}

	for line := range c.Lines {
		prefix := ""
		if opts.LinePrefix != nil {
			prefix = opts.LinePrefix(strings.TrimSuffix(filepath.Base(outfile), filepath.Ext(outfile)))
		}
		fmt.Fprintf(writer, "%s%s\n", prefix, line.Text)
	}

	return nil
}
