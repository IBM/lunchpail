package shell

import (
	"crypto/sha256"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Lower(buildName, runname string, app hlir.Application, ir llir.LLIR, opts build.Options) (llir.Component, error) {
	var component lunchpail.Component
	switch app.Spec.Role {
	case "worker":
		component = lunchpail.WorkersComponent
	default:
		component = lunchpail.DispatcherComponent
	}

	return LowerAsComponent(buildName, runname, app, ir, llir.ShellComponent{Component: component}, opts)
}

func LowerAsComponent(buildName, runname string, app hlir.Application, ir llir.LLIR, component llir.ShellComponent, opts build.Options) (llir.Component, error) {
	component.Application = app
	if component.Sizing.Workers == 0 {
		component.Sizing = api.ApplicationSizing(app, opts)
	}
	if component.QueuePrefixPath == "" {
		component.QueuePrefixPath = api.QueuePrefixPath(ir.Queue, runname)
	}
	if component.InstanceName == "" {
		component.InstanceName = runname
	}

	for _, needs := range app.Spec.Needs {
		var file *os.File
		var err error
		var req string

		if needs.Requirements != "" {
			file, err = os.CreateTemp("", "requirements.txt")
			if err != nil {
				return nil, err
			}

			if err := os.WriteFile(file.Name(), []byte(needs.Requirements), 0644); err != nil {
				return nil, err
			}
			req = "--requirements " + file.Name()
			if opts.Log.Verbose {
				fmt.Printf("Setting requirements in %s", file.Name())
			}
		}

		component.Spec.Command = fmt.Sprintf(`PATH=$($LUNCHPAIL_EXE needs %s %s %s --verbose=%v)/bin:$PATH %s`, needs.Name, needs.Version, req, opts.Log.Verbose, component.Spec.Command)
	}

	for _, dataset := range app.Spec.Datasets {
		if dataset.S3.Rclone.RemoteName != "" && dataset.S3.CopyIn.Path != "" {
			// We were asked to copy data in from s3, so
			// we will use the secrets attached to an
			// initContainer
			isValid, spec, err := queue.SpecFromRcloneRemoteName(dataset.S3.Rclone.RemoteName, "", runname, ir.Queue.Port)

			if err != nil {
				return nil, err
			} else if !isValid {
				return nil, fmt.Errorf("Error: invalid or missing rclone config for given remote=%s for Application=%s", dataset.S3.Rclone.RemoteName, app.Metadata.Name)
			}

			// sleep to delay the copy-out, if requested
			component.Spec.Command = fmt.Sprintf(`sleep %d
env lunchpail_queue_endpoint=%s lunchpail_queue_accessKeyID=%s lunchpail_queue_secretAccessKey=%s $LUNCHPAIL_EXE queue download %s %s/%s
%s`, dataset.S3.CopyIn.Delay, spec.Endpoint, spec.AccessKey, spec.SecretKey, dataset.S3.CopyIn.Path, dataset.Name, filepath.Base(dataset.S3.CopyIn.Path), component.Spec.Command)
		}
	}
	return component, nil
}

func getSHA256Sum(fileName string) ([]byte, error) {
	f, err := os.Open(fileName)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, f); err != nil {
		log.Fatal(err)
	}
	return hash.Sum(nil), nil
}

func venvsdir() (string, error) {
	cachedir, err := os.UserCacheDir()
	if err != nil {
		return "", err
	}

	return filepath.Join(cachedir, "lunchpail", "venvs"), nil
}
