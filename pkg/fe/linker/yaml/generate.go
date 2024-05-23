package yaml

import (
	"fmt"
	"os"
	"os/exec"
	"os/user"

	"lunchpail.io/pkg/fe/assembler"
	"lunchpail.io/pkg/fe/linker/yaml/queue"
	"lunchpail.io/pkg/lunchpail"
)

type GenerateOptions struct {
	Namespace          string
	ClusterIsOpenShift bool
	ImagePullSecret    string
	OverrideValues     []string
	Verbose            bool
	Queue              string
	HasGpuSupport      bool
	DockerHost         string
	CreateNamespace    bool
}

// Inject Run or WorkDispatcher resources if needed
func injectAutoRun(appname, runname, templatePath string, verbose bool) (string, []string, error) {
	sets := []string{} // we will assemble helm `--set` options
	appdir := assembler.Appdir(templatePath)

	// TODO port this to pure go?
	cmd := exec.Command("grep", "-qr", "^kind:[[:space:]]*Run$", appdir)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return "", []string{}, err
	}
	if err := cmd.Wait(); err != nil {
		if verbose {
			fmt.Fprintln(os.Stderr, "Auto-Injecting WorkStealer initiation")
		}
		sets = append(sets, "autorun="+runname)
	}

	// TODO port this to pure go?
	cmd2 := exec.Command("grep", "-qr", "^kind:[[:space:]]*WorkDispatcher$", appdir)
	cmd2.Stdout = os.Stdout
	cmd2.Stderr = os.Stderr
	if err := cmd2.Start(); err != nil {
		return "", []string{}, err
	}
	if err := cmd2.Wait(); err != nil {
		// TODO port this to pure go?
		cmd3 := exec.Command("grep", "-qr", "^  role:[[:space:]]*dispatcher$", appdir)
		cmd3.Stdout = os.Stdout
		cmd3.Stderr = os.Stderr
		if err := cmd3.Start(); err != nil {
			return "", []string{}, err
		}
		if err := cmd3.Wait(); err == nil {
			if verbose {
				fmt.Println("Auto-Injecting WorkDispatcher")
			}
			sets = append(sets, "autodispatcher.name="+appname)
			sets = append(sets, "autodispatcher.application="+appname)
		}
	}

	if len(sets) == 0 {
		return appname, sets, nil
	} else {
		return runname, sets, nil
	}
}

func Generate(appname, runname, namespace, templatePath string, internalS3Port int, queueSpec queue.Spec, opts GenerateOptions) (string, string, []string, error) {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Stage directory %s\n", templatePath)
	}

	shrinkwrappedOptions, err := lunchpail.RestoreAppOptions(templatePath)
	if err != nil {
		return "", "", []string{}, err
	} else {
		// TODO here... how do we determine that boolean values were unset?
		if opts.Namespace == "" {
			opts.Namespace = shrinkwrappedOptions.Namespace
		}
		if opts.ImagePullSecret == "" {
			opts.ImagePullSecret = shrinkwrappedOptions.ImagePullSecret
		}

		// careful: `--set x=3 --set x=4` results in x having
		// value 4, so we need to place the shrinkwrapped
		// options first in the list
		opts.OverrideValues = append(shrinkwrappedOptions.OverrideValues, opts.OverrideValues...)

		if opts.Queue == "" {
			opts.Queue = shrinkwrappedOptions.Queue
		}
		if opts.DockerHost == "" {
			opts.DockerHost = shrinkwrappedOptions.DockerHost
		}
	}

	runname, extraValues, err := injectAutoRun(appname, runname, templatePath, opts.Verbose)
	if err != nil {
		return "", "", []string{}, err
	} else {
		opts.OverrideValues = append(opts.OverrideValues, extraValues...)

	}

	systemNamespace := namespace

	clusterType := "k8s"
	imageRegistry := "ghcr.io"
	imageRepo := "lunchpail"

	if opts.ClusterIsOpenShift {
		clusterType = "oc"
	}

	imagePullSecretName, dockerconfigjson, ipsErr := imagePullSecret(opts.ImagePullSecret)
	if ipsErr != nil {
		return "", "", []string{}, ipsErr
	}

	user, err := user.Current()
	if err != nil {
		return "", "", []string{}, err
	}

	// the app.kubernetes.io/part-of label value
	partOf := appname

	yaml := fmt.Sprintf(`
global:
  type: %s # clusterType (1)
  dockerHost: %s # dockerHost (2)
  rbac:
    serviceaccount: %s # runname (3)
    runAsRoot: false
  image:
    registry: %s # imageRegistry (4)
    repo: %s # imageRepo (5)
  jaas:
    ips: %s # imagePullSecretName (6)
    dockerconfigjson: %s # dockerconfigjson (7)
    namespace:
      name: %v # systemNamespace (8)
      create: %v # opts.CreateNamespace (9)
    context:
      name: ""
  s3Endpoint: http://%s-s3.%s.svc.cluster.local:%d # runname (10) systemNamespace (11) internalS3Port (12)
  s3AccessKey: lunchpail
  s3SecretKey: lunchpail
lunchpail: lunchpail
username: %s # user.Username (13)
uid: %s # user.Uid (14)
mcad:
  enabled: false
rbac:
  serviceaccount: %s # runname (15)
image:
  registry: %s # imageRegistry (16)
  repo: %s # imageRepo (17)
  version: %v # lunchpail.Version() (18)
partOf: %s # partOf (19)
taskqueue:
  auto: %v # queueSpec.Auto (20)
  dataset: %s # queueSpec.Name (21)
  endpoint: %s # queueSpec.Endpoint (22)
  bucket: %s # queueSpec.Bucket (23)
  accessKey: %s # queueSpec.AccessKey (24)
  secretKey: %s # queueSpec.SecretKey (25)
name: %s # runname (26)
namespace:
  user: %s # namespace (27)
tags:
  gpu: %v # hasGpuSupport (28)
core:
  lunchpail: lunchpail
  name: %s # runname (29)
  appname: %s # appname (30)
s3:
  name: %s # runname (31)
  port: %d # internalS3Port (32)
  appname: %s # appname (33)
`,
		clusterType,          // (1)
		opts.DockerHost,      // (2)
		runname,              // (3)
		imageRegistry,        // (4)
		imageRepo,            // (5)
		imagePullSecretName,  // (6)
		dockerconfigjson,     // (7)
		systemNamespace,      // (8)
		opts.CreateNamespace, // (9)

		runname,             // (10)
		systemNamespace,     // (11)
		internalS3Port,      // (12)
		user.Username,       // (13)
		user.Uid,            // (14)
		runname,             // (15)
		imageRegistry,       // (16)
		imageRepo,           // (17)
		lunchpail.Version(), // (18)
		partOf,              // (19)
		queueSpec.Auto,      // (20)
		queueSpec.Name,      // (21)
		queueSpec.Endpoint,  // (22)
		queueSpec.Bucket,    // (23)
		queueSpec.AccessKey, // (24)
		queueSpec.SecretKey, // (25)
		runname,             // (26)
		namespace,           // (27)
		opts.HasGpuSupport,  // (28)
		runname,             // (29)
		appname,             // (30)
		runname,             // (31)
		internalS3Port,      // (32)
		appname,             // (33)
	)

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "shrinkwrap app values=%s\n", yaml)
		fmt.Fprintf(os.Stderr, "shrinkwrap app overrides=%v\n", opts.OverrideValues)
	}

	return runname, yaml, opts.OverrideValues, nil
}
