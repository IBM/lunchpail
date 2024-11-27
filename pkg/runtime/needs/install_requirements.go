package needs

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
)

func requirementsInstall(ctx context.Context, version, requirements string, verbose bool) (string, error) {
	var verboseFlag string
	var reqmtsByte []byte
	var reqmtsFile *os.File
	var err error

	if reqmtsByte, err = base64.StdEncoding.DecodeString(requirements); err != nil {
		return "", err
	}

	if verbose {
		verboseFlag = "--verbose"
		fmt.Fprintf(os.Stderr, "Installing requirements\n%s\n", string(reqmtsByte))
	}

	//Main cache dir for all virtual envs
	venvsDir, err := venvsdir()
	if err != nil {
		return "", err
	}

	//Create a cache venv dir for this run using SHA256 of requirements content
	sha, err := getSHA256Sum(reqmtsByte)
	if err != nil {
		return "", err
	}
	venvPath := filepath.Join(venvsDir, sha)
	if err := os.MkdirAll(venvPath, os.ModePerm); err != nil {
		return "", err
	}

	lockfile, err := os.OpenFile(filepath.Join(venvPath, "lock.txt"), os.O_RDWR|os.O_CREATE, 0644)
	if err != nil {
		return "", err
	}
	defer lockfile.Close()
	err = syscall.Flock(int(lockfile.Fd()), syscall.LOCK_EX)
	if err != nil {
		return "", err
	}

	// PATH to our venv/bin
	path := filepath.Join(venvPath, "bin")

	if _, err := os.Stat(path); err == nil {
		// then the venv already exists
		if verbose {
			fmt.Fprintf(os.Stderr, "Skipping requirements install since virtual env exists\n")
		}
		return path, nil
	}

	// otherwise populate the venv

	//Create a requirements file in cache venv dir
	if reqmtsFile, err = os.Create(filepath.Join(venvPath, "requirements.txt")); err != nil {
		return "", err
	}
	if _, err = reqmtsFile.Write(reqmtsByte); err != nil {
		return "", err
	}

	nocache := ""
	if os.Getenv("LUNCHPAIL_NO_CACHE") != "" {
		nocache = "--no-cache-dir"
	}

	quiet := "-q"
	if verbose {
		quiet = ""
	}

	if version == "" || version == "latest" {
		version = "3"
	}

	cmdline := fmt.Sprintf(`python%s -m venv %s
source %s/bin/activate
if ! which pip%s; then python%s -m pip install pip %s; fi
pip%s install %s %s -r %s %s 1>&2`, version, venvPath, venvPath, version, version, verboseFlag, version, nocache, quiet, reqmtsFile.Name(), verboseFlag)

	cmd := exec.CommandContext(ctx, "/bin/bash", "-c", cmdline)
	cmd.Dir = filepath.Dir(venvPath)
	cmd.Stdout = os.Stderr // Stderr so as not to collide with `lunchpail needs` stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		// Clean up the venv cache directory, since we failed at populating it
		if err := os.RemoveAll(venvPath); err != nil {
			fmt.Fprintln(os.Stderr, "Unable to clean up venv cache directory after pip install failure", err)
		}
		return path, err
	}

	return path, nil
}

func getSHA256Sum(requirements []byte) (string, error) {
	hash := sha256.New()
	if _, err := hash.Write(requirements); err != nil {
		return "", err
	}

	return fmt.Sprintf("%x", hash.Sum(nil)), nil
}

func venvsdir() (string, error) {
	venvPath := os.Getenv("LUNCHPAIL_VENV_CACHEDIR")
	if venvPath == "" {
		cachedir, err := os.UserCacheDir()
		if err != nil {
			return "", err
		}

		venvPath = filepath.Join(cachedir, "lunchpail", "venvs")
		if err := os.MkdirAll(venvPath, os.ModePerm); err != nil {
			return "", err
		}
	}

	return venvPath, nil
}
