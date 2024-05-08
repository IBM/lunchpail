package shrinkwrap

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"io/ioutil"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kirsle/configdir"
	"github.com/mittwald/go-helm-client"
	"github.com/mittwald/go-helm-client/values"
	"helm.sh/helm/v3/pkg/chartutil"
	"lunchpail.io/pkg/lunchpail"
)

type AppOptions struct {
	Namespace          string
	ClusterIsOpenShift bool
	ImagePullSecret    string
	OverrideValues     []string
	Verbose            bool
	Queue              string
	HasGpuSupport      bool
	DockerHost         string
	DryRun             bool
	Scripts            string
}

//go:generate /bin/sh -c "[ -d ../../charts ] && tar --exclude '*~' --exclude '*README.md' -C ../../charts -zcf charts.tar.gz . || exit 0"
//go:embed charts.tar.gz
var appTemplate embed.FS

//go:generate /bin/sh -c "tar --exclude '*DS_Store*' --exclude '*~' --exclude '*README.md' -C ./scripts -zcf app-scripts.tar.gz ."
//go:embed app-scripts.tar.gz
var scripts embed.FS

// truncate `str` to have at most `max` length
func truncate(str string, max int) string {
	if len(str) > max {
		return str[:max]
	} else {
		return str
	}
}

func autorunName(appname string) (string, error) {
	runname := appname

	if id, err := uuid.NewRandom(); err != nil {
		return "", err
	} else {
		// include up to the first dash of the uuid, which
		// gives us 8 characters of randomness
		ids := id.String()
		if idx := strings.Index(ids, "-"); idx != -1 {
			ids = ids[:idx]
		}

		runname = truncate(runname+"-"+ids, 53)
	}

	return runname, nil
}

// Inject Run or WorkDispatcher resources if needed
func injectAutoRun(appname, templatePath string, verbose bool) (string, []string, error) {
	sets := []string{} // we will assemble helm `--set` options
	appdir := filepath.Join(templatePath, "templates", appname)

	runname, err := autorunName(appname)
	if err != nil {
		return "", []string{}, nil
	}

	// TODO port this to pure go?
	cmd := exec.Command("grep", "-qr", "^kind:[[:space:]]*Run$", appdir)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return "", []string{}, err
	}
	if err := cmd.Wait(); err != nil {
		if verbose {
			fmt.Println("Auto-Injecting WorkStealer initiation")
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

func generateAppYaml(appname, namespace, templatePath string, opts AppOptions) error {
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Stage directory %s\n", templatePath)
	}

	shrinkwrappedOptions, err := lunchpail.RestoreAppOptions(templatePath)
	if err != nil {
		return err
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

	runname, extraValues, err := injectAutoRun(appname, templatePath, opts.Verbose)
	if err != nil {
		return err
	} else {
		opts.OverrideValues = append(opts.OverrideValues, extraValues...)

	}

	systemNamespace := namespace

	clusterName := "lunchpail"
	clusterType := "k8s"
	imageRegistry := "ghcr.io"
	imageRepo := "lunchpail"

	if opts.ClusterIsOpenShift {
		clusterType = "oc"
	}

	imagePullSecretName, dockerconfigjson, ipsErr := ImagePullSecret(opts.ImagePullSecret)
	if ipsErr != nil {
		return ipsErr
	}

	user, err := user.Current()
	if err != nil {
		return err
	}

	// the app.kubernetes.io/part-of label value
	partOf := appname

	// name of taskqueue Secret
	taskqueueName := "defaultjaasqueue" // TODO externalize string
	taskqueueAuto := true               // create a queue (rather than use one supplied by the app)
	if opts.Queue != "" {
		taskqueueName = opts.Queue
		taskqueueAuto = false
	}

	yaml := fmt.Sprintf(`
global:
  type: %s # clusterType (1)
  dockerHost: %s # dockerHost (2)
  rbac:
    serviceaccount: %s # clusterName (3)
    runAsRoot: false
  image:
    registry: %s # imageRegistry (4)
    repo: %s # imageRepo (5)
  jaas:
    ips: %s # imagePullSecretName (6)
    dockerconfigjson: %s # dockerconfigjson (7)
    namespace:
      name: %v # systemNamespace (8)
      create: %v # false (9)
    context:
      name: ""
  s3Endpoint: http://s3.%v.svc.cluster.local:9000 # systemNamespace (10)
  s3AccessKey: lunchpail
  s3SecretKey: lunchpail
lunchpail: lunchpail
username: %s # user.Username (11)
uid: %s # user.Uid (12)
mcad:
  enabled: false
rbac:
  serviceaccount: %s # clusterName (13)
image:
  registry: %s # imageRegistry (14)
  repo: %s # imageRepo (15)
  version: %v # lunchpail.Version() (16)
partOf: %s # partOf (17)
taskqueue:
  auto: %v # taskqueueAuto (18)
  dataset: %s # taskqueueName (19)
name: %s # runname (20)
namespace:
  user: %s # namespace (21)
tags:
  gpu: %v # hasGpuSupport (22)
core:
  lunchpail: lunchpail
`,
		clusterType,         // (1)
		opts.DockerHost,     // (2)
		clusterName,         // (3)
		imageRegistry,       // (4)
		imageRepo,           // (5)
		imagePullSecretName, // (6)
		dockerconfigjson,    // (7)
		systemNamespace,     // (8)
		false,               // (9)

		systemNamespace,     // (10)
		user.Username,       // (11)
		user.Uid,            // (12)
		clusterName,         // (13)
		imageRegistry,       // (14)
		imageRepo,           // (15)
		lunchpail.Version(), // (16)
		partOf,              // (17)
		taskqueueAuto,       // (18)
		taskqueueName,       // (19)
		runname,             // (20)
		namespace,           // (21)
		opts.HasGpuSupport,  // (22)
	)

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "shrinkwrap app values=%s\n", yaml)
		fmt.Fprintf(os.Stderr, "shrinkwrap app overrides=%v\n", opts.OverrideValues)
	}

	chartSpec := helmclient.ChartSpec{
		ReleaseName:      "lunchpail-app",
		ChartName:        templatePath,
		Namespace:        namespace,
		Wait:             true,
		UpgradeCRDs:      true,
		CreateNamespace:  !opts.DryRun,
		DependencyUpdate: true,
		Timeout:          360 * time.Second,
		ValuesYaml:       yaml,
		ValuesOptions: values.Options{
			Values: opts.OverrideValues,
		},
	}

	options := &helmclient.HelmTemplateOptions{
		KubeVersion: &chartutil.KubeVersion{
			Version: "v1.23.10",
			Major:   "1",
			Minor:   "23",
		},
		APIVersions: []string{
			"helm.sh/v1/Test",
		},
	}

	helmCacheDir := configdir.LocalCache("helm")
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Using Helm repository cache=%s\n", helmCacheDir)
	}

	outputOfHelmCmd := ioutil.Discard
	if opts.Verbose {
		outputOfHelmCmd = os.Stdout
	}

	helmClient, newClientErr := helmclient.New(&helmclient.Options{Namespace: namespace,
		Output:          outputOfHelmCmd,
		RepositoryCache: helmCacheDir,
	})
	if newClientErr != nil {
		return newClientErr
	}

	if opts.DryRun {
		if res, err := helmClient.TemplateChart(&chartSpec, options); err != nil {
			return err
		} else {
			fmt.Println(string(res))
		}
	} else if _, err := helmClient.InstallOrUpgradeChart(context.Background(), &chartSpec, nil); err != nil {
		return err
	}

	if opts.Scripts != "" {
		if err := Expand(opts.Scripts, scripts, "app-scripts.tar.gz", false); err != nil {
			return err
		} else if err := updateScripts(opts.Scripts, appname, runname, namespace, systemNamespace, opts.Verbose); err != nil {
			return err
		}
	}

	if !opts.Verbose {
		defer os.RemoveAll(templatePath)
	} else {
		fmt.Fprintf(os.Stderr, "Template directory: %s\n", templatePath)
	}

	return nil
}

// hack, we still use sed here to update the script templates
func updateScripts(path, appname, runname, userNamespace, systemNamespace string, verbose bool) error {
	return filepath.Walk(
		path,
		func(path string, info fs.FileInfo, err error) error {
			if !info.IsDir() && filepath.Ext(path) != ".namespace" && filepath.Ext(path) != "yml" && filepath.Ext(path) != ".tmp" && filepath.Ext(path) != ".DS_Store" {
				// TODO: ugh sed
				sed := "cat " + path + " | sed 's#the_lunchpail_app#" + appname + "#g' | sed 's#the_lunchpail_run#" + runname + "#g' | sed 's#jaas-user#" + userNamespace + "#g' | sed 's#jaas-system#" + systemNamespace + "#g' > " + path + ".tmp && mv " + path + ".tmp " + path + " && chmod +x " + path
				cmd := exec.Command("sh", "-c", sed)
				if verbose {
					cmd.Stdout = os.Stdout
				}
				cmd.Stderr = os.Stderr
				if err := cmd.Run(); err != nil {
					return err
				}
			}
			return nil
		})
}
