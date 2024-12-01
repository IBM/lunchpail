//go:build full || manage

package boot

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"io/fs"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"slices"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/builder"
	"lunchpail.io/pkg/fe/builder/overlay"
	"lunchpail.io/pkg/observe/colors"
)

type BuildAndTester struct {
	Concurrency int
	be.Backend
	build.Options
}

// Run build&test for all applications in all of the given `dirs`
func (t BuildAndTester) RunAll(ctx context.Context, dirs []string) error {
	fmt.Fprintln(os.Stderr, "Starting build and test for", dirs)

	dirForBinaries, err := ioutil.TempDir("", "lunchpail-bat-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(dirForBinaries)

	group, gctx := errgroup.WithContext(ctx)
	if t.Concurrency != 0 {
		group.SetLimit(t.Concurrency)
	}

	for _, dir := range dirs {
		if err := t.RunDir(gctx, group, dir, dirForBinaries); err != nil {
			return err
		}
	}

	return group.Wait()
}

// Run build&test for all applications in the given `dir`
func (t BuildAndTester) RunDir(ctx context.Context, group *errgroup.Group, dir, dirForBinaries string) error {
	return filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if d.Name() == "src" || d.Name() == "test-data" {
			return fs.SkipDir
		} else if !d.IsDir() || d.Name() == filepath.Base(dir) {
			return nil
		}

		if files, err := os.ReadDir(path); err != nil {
			return err
		} else if slices.IndexFunc(files, func(f fs.DirEntry) bool { return f.Name() == "src" || f.Name() == "test-data" }) < 0 {
			// not an app directory
			if t.Options.Verbose() {
				fmt.Fprintln(os.Stderr, "Skipping build and test for", path)
			}
			return nil
		}

		group.Go(func() error {
			binaryRelPath, err := filepath.Rel(dir, path)
			if err != nil {
				return err
			}
			binaryFullPath := filepath.Join(dirForBinaries, binaryRelPath)
			return t.Run(ctx, path, binaryRelPath, binaryFullPath)
		})

		return nil
	})
}

// Run one build&test for the application specified in `sourcePath`, storing the build in `binaryFullPath`
func (t BuildAndTester) Run(ctx context.Context, sourcePath, binaryRelPath, binaryFullPath string) error {
	select {
	case <-ctx.Done():
		return nil
	default:
	}

	if err := builder.Build(
		ctx,
		sourcePath,
		builder.Options{
			Name:           binaryFullPath,
			OverlayOptions: overlay.Options{BuildOptions: t.Options},
		},
	); err != nil {
		return err
	}

	args := []string{"test"}
	if t.Options.Verbose() {
		args = append(args, "--verbose")
	}

	cmd := exec.CommandContext(ctx, binaryFullPath, args...)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}
	if err := cmd.Start(); err != nil {
		fmt.Fprintf(os.Stderr, "Error launching test %s: %v\n", binaryRelPath, err)
		return err
	}
	doneout := make(chan struct{})
	doneerr := make(chan struct{})

	go pipe(binaryRelPath, stdout, os.Stdout, doneout)
	go pipe(binaryRelPath, stderr, os.Stderr, doneerr)

	select {
	case <-ctx.Done():
		return nil
	case <-doneout:
	}
	select {
	case <-ctx.Done():
		return nil
	case <-doneerr:
	}

	return cmd.Wait()
}

// Pipe the output of the test, prefixing emitted lines with the given prefix (application name)
func pipe(prefix string, r io.Reader, w io.Writer, done chan<- struct{}) {
	reader := bufio.NewReader(r)

	for {
		line, _, err := reader.ReadLine()

		if err == io.EOF {
			break
		}

		fmt.Fprintf(w, "%s %s\n", colors.Yellow.Render(prefix), line)
	}

	done <- struct{}{}
}
