package shell

import (
	"fmt"
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
