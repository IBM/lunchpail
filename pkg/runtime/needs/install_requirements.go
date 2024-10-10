package needs

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func requirementsInstall(ctx context.Context, venvPath string, requirementsPath string, verbose bool) error {
	var cmd *exec.Cmd
	var verboseFlag string
	dir := filepath.Dir(venvPath)

	if verbose {
		verboseFlag = "--verbose"
	}

	venvRequirementsPath := filepath.Join(venvPath, filepath.Base(requirementsPath))
	cmds := fmt.Sprintf(`python3 -m venv %s
cp %s %s
source %s/bin/activate
python3 -m pip install --upgrade pip %s
pip3 install -r %s %s 1>&2`, venvPath, requirementsPath, venvPath, venvPath, verboseFlag, venvRequirementsPath, verboseFlag)

	cmd = exec.CommandContext(ctx, "/bin/bash", "-c", cmds)
	cmd.Dir = dir
	if verbose {
		cmd.Stdout = os.Stdout
	}
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
