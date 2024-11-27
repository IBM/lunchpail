package shell

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"os"

	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func pipe(mkpipe func() (io.ReadCloser, error), out io.Writer, teefile string, c llir.ShellComponent) (chan struct{}, error) {
	p, err := mkpipe()
	if err != nil {
		return nil, err
	}

	w, err := os.OpenFile(teefile, os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return nil, err
	}

	done := make(chan struct{})
	go func() {
		var writer io.Writer
		switch c.C() {
		case lunchpail.WorkStealerComponent, lunchpail.MinioComponent:
			writer = w
		default:
			writer = io.MultiWriter(out, w)
		}

		defer p.Close()
		defer w.Close()

		scanner := bufio.NewScanner(p)
		for scanner.Scan() {
			fmt.Fprintf(writer, "[%v] %s\n", lunchpail.ComponentShortName(c.C()), scanner.Text())
		}
		done <- struct{}{}
	}()

	return done, nil
}

type nonVerboseFilter struct {
	stream io.Writer
}

func (filter nonVerboseFilter) Write(p []byte) (n int, err error) {
	switch {
	case bytes.HasPrefix(p, []byte("[INFO] ")):
		return filter.stream.Write(p[8:])
	case bytes.HasPrefix(p, []byte("[DEBUG] ")):
		return filter.stream.Write(p[9:])
	}

	return filter.stream.Write(p)
}
