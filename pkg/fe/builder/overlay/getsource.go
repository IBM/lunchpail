package overlay

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func getSource(sourcePath, templatePath, branch string, verbose bool) (err error) {
	isGitSsh := strings.HasPrefix(sourcePath, "git@")
	isGitHttp := !isGitSsh && strings.HasPrefix(sourcePath, "https:")
	if isGitSsh || isGitHttp {
		if err = getSourceFromGit(sourcePath, templatePath, branch, verbose); err != nil {
			return
		}
	} else if err = getSourceFromLocal(sourcePath, templatePath, verbose); err != nil {
		return
	}

	return
}

func getSourceFromGit(sourcePath, templatePath, branch string, verbose bool) error {
	quietArg := "-q"
	if verbose {
		quietArg = ""
	}

	branchArg := ""
	if branch != "" {
		branchArg = "--branch=" + branch
	}
	fmt.Fprintf(os.Stderr, "Cloning application repository...")
	cmd := exec.Command("/bin/sh", "-c", "git clone --depth=1 "+sourcePath+" "+branchArg+" "+quietArg+" "+filepath.Base(appdir(templatePath)))
	cmd.Dir = filepath.Dir(appdir(templatePath))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return err
	}
	if err := cmd.Wait(); err != nil {
		return err
	}
	fmt.Fprintln(os.Stderr, " done")

	return nil
}

func getSourceFromLocal(sourcePath, templatePath string, verbose bool) error {
	if f, err := os.Stat(sourcePath); err != nil {
		return err
	} else if !f.IsDir() {
		return fmt.Errorf("Input path is not a directory: %s", sourcePath)
	}

	// TODO port this to pure go?
	verboseFlag := ""
	if verbose {
		verboseFlag = " -v "
	}
	cmdline := "tar --exclude '*~' -C " + sourcePath + verboseFlag + " -cf - . | tar -C " + appdir(templatePath) + verboseFlag + " -xf -"
	if verbose {
		fmt.Fprintf(os.Stderr, "Using tar to inject source: %s\n", cmdline)
	}

	cmd := exec.Command("sh", "-c", "tar --exclude '*~' -C "+sourcePath+verboseFlag+" -cf - . | tar -C "+appdir(templatePath)+verboseFlag+" -xf -")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}
