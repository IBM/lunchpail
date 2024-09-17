package local

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/nxadm/tail"
	"golang.org/x/sync/errgroup"

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

func (s localStreamer) RunComponentUpdates() (chan events.ComponentUpdate, chan events.Message, error) {
	cc := make(chan events.ComponentUpdate)
	cm := make(chan events.Message)
	return cc, cm, nil
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