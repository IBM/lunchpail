package assembler

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
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

func gobuild(dir, name string) error {
	absName, err := filepath.Abs(name)
	if err != nil {
		return err
	}

	cmd := exec.Command("go", "build", "-ldflags", "-s -w", "-o", absName, "cmd/main.go")
	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env, "CGO_ENABLED=0")

	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}

func compile(dir, name string) error {
	fmt.Fprint(os.Stderr, "Generating application binary...")
	if err := goget(dir); err != nil {
		return err
	}

	if err := gogenerate(dir); err != nil {
		return err
	}

	if err := gobuild(dir, name); err != nil {
		return err
	}
	fmt.Fprintln(os.Stderr, " done")

	return nil
}
