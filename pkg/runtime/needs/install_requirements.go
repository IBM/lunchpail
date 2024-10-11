package needs

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func requirementsInstall(ctx context.Context, requirements string, verbose bool) (string, error) {
	var cmd *exec.Cmd
	var verboseFlag string
	var reqmtsByte []byte
	var reqmtsFile *os.File
	var err error

	if verbose {
		verboseFlag = "--verbose"
	}

	if reqmtsByte, err = base64.StdEncoding.DecodeString(requirements); err != nil {
		return "", err
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

	//Create a requirements file in cache venv dir
	if reqmtsFile, err = os.Create(filepath.Join(venvPath, "requirements.txt")); err != nil {
		return "", err
	}
	if _, err = reqmtsFile.Write(reqmtsByte); err != nil {
		return "", err
	}

	cmds := fmt.Sprintf(`python3 -m venv %s
source %s/bin/activate
if ! which pip3; then python3 -m pip install pip %s; fi
pip3 install -r %s %s 1>&2`, venvPath, venvPath, verboseFlag, reqmtsFile.Name(), verboseFlag)

	cmd = exec.CommandContext(ctx, "/bin/bash", "-c", cmds)
	cmd.Dir = filepath.Dir(venvPath)
	if verbose {
		cmd.Stdout = os.Stderr
	}
	cmd.Stderr = os.Stderr
	return filepath.Join(venvPath, "bin"), cmd.Run()
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
