package init

import (
	"fmt"
	which "github.com/hairyhenderson/go-which"
	"os"
	"os/exec"
	"runtime"
)

func getKubectl() error {
	if which.Found("kubectl") {
		fmt.Println("kubectl: installed")
	} else {
		fmt.Println("kubectl: installing")
		script := "curl -LO https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/" + runtime.GOOS + "/" + runtime.GOARCH + "/kubectl && chmod +x kubectl && sudo mv kubectl /usr/local/bin"
		cmd := exec.Command("sh", "-c", script)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			return err
		}
	}

	return nil
}
