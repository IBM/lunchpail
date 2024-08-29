package shell

import (
	"bufio"
	"fmt"
	"io"
	"os"

	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func pipe(f func() (io.ReadCloser, error), out io.Writer, teefile string, c llir.Component) (chan struct{}, error) {
	p, err := f()
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
