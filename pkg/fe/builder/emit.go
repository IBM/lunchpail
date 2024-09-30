package builder

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"golang.org/x/sync/errgroup"
)

func goget(dir string) error {
	cmd := exec.Command("go", "get", "./...")
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}

func gogenerate(dir string) error {
	cmd := exec.Command("go", "generate", "./...")
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}

func gobuild(dir, name, targetOs, targetArch string) error {
	absName, err := filepath.Abs(name)
	if err != nil {
		return err
	}

	targetName := absName
	if targetOs != "" && targetArch != "" {
		targetName = absName + "-" + targetOs + "-" + targetArch
	}

	cmd := exec.Command("go", "build", "-tags", "full", "-ldflags", "-s -w", "-o", targetName, "cmd/main.go")
	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env, "CGO_ENABLED=0")
	cmd.Env = append(cmd.Env, "GOOS="+targetOs)
	cmd.Env = append(cmd.Env, "GOARCH="+targetArch)

	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}

// Emit application binary for the given os and arch
func emit(dir, name, targetOs, targetArch string) error {
	fmt.Fprintln(os.Stderr, "Generating application binary "+targetOs+" "+targetArch)
	if err := goget(dir); err != nil {
		return err
	}

	if err := gogenerate(dir); err != nil {
		return err
	}

	if err := gobuild(dir, name, targetOs, targetArch); err != nil {
		return err
	}

	return nil
}

// emit() but for all supported os and arch
func emitAll(ctx context.Context, dir, name string) error {
	group, _ := errgroup.WithContext(ctx)

	for _, targetOs := range supportedOs() {
		for _, targetArch := range supportedArch() {
			group.Go(func() error {
				return emit(dir, name, targetOs, targetArch)
			})
		}
	}

	return group.Wait()
}
