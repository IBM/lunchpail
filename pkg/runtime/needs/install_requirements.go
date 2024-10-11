package needs

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
)

func requirementsInstall(ctx context.Context, requirementsPath string, verbose bool) (string, error) {
	var cmd *exec.Cmd
	var verboseFlag string

	if verbose {
		verboseFlag = "--verbose"
	}

	sha, err := getSHA256Sum(requirementsPath)
	if err != nil {
		return "", err
	}

	venvsDir, err := venvsdir()
	if err != nil {
		return "", err
	}

	venvPath := filepath.Join(venvsDir, hex.EncodeToString(sha))
	if err := os.MkdirAll(venvPath, os.ModePerm); err != nil {
		return "", err
	}

	dir := filepath.Dir(venvPath)
	venvRequirementsPath := filepath.Join(venvPath, filepath.Base(requirementsPath))

	cmds := fmt.Sprintf(`python3 -m venv %s
cp %s %s
source %s/bin/activate
if ! which pip3; then python3 -m pip install pip %s; fi
pip3 install -r %s %s 1>&2`, venvPath, requirementsPath, venvPath, venvPath, verboseFlag, venvRequirementsPath, verboseFlag)

	cmd = exec.CommandContext(ctx, "/bin/bash", "-c", cmds)
	cmd.Dir = dir
	if verbose {
		cmd.Stdout = os.Stderr
	}
	cmd.Stderr = os.Stderr
	return venvPath, cmd.Run()
}

func getSHA256Sum(filePath string) ([]byte, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, f); err != nil {
		return nil, err
	}
	return hash.Sum(nil), nil
}

func venvsdir() (string, error) {
	venvPath := os.Getenv("LUNCHPAIL_VENV_CACHEDIR")
	if venvPath == "" {
		cachedir, err := os.UserCacheDir()
		if err != nil {
			return "", err
		}

		venvPath = filepath.Join(cachedir, "lunchpail", "venvs")
	}

	return venvPath, nil
}
