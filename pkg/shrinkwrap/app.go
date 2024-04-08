package shrinkwrap

import (
	"fmt"
	"os"
	//"helm.sh/helm/v3/pkg/chartutil"
	//"github.com/mittwald/go-helm-client"
	//	"github.com/go-git/go-git/v5"
)

type AppOptions struct {
}

func App(sourcePath, outputPath string, opts AppOptions) error {
	fileInfo, err := os.Stat(sourcePath)
	if err != nil {
		return err
	}

	if !fileInfo.IsDir() {
		return fmt.Errorf("Source path not a directory %s\n", sourcePath)
	}

	return nil
}
