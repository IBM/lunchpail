package shrinkwrap

import (
	"embed"
	"fmt"
	"github.com/google/uuid"
	"github.com/mittwald/go-helm-client"
	"github.com/mittwald/go-helm-client/values"
	"helm.sh/helm/v3/pkg/chartutil"
	"io"
	"io/fs"
	"io/ioutil"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"regexp"
	"strings"
	//	"github.com/go-git/go-git/v5"

	"lunchpail.io/pkg/lunchpail"
)

type AppOptions struct {
	Namespace          string
	AppName            string
	ClusterIsOpenShift bool
	WorkdirViaMount    bool
	ImagePullSecret    string
	Branch             string
	OverrideValues     []string
	Verbose            bool
	Queue              string
	NeedsCsiH3         bool
	NeedsCsiS3         bool
	NeedsCsiNfs        bool
	HasGpuSupport      bool
	DockerHost         string
	Force              bool
}

//go:generate /bin/sh -c "tar --exclude '*~' --exclude '*README.md' -C ../../charts/app -zcf app.tar.gz ."
//go:embed app.tar.gz
var appTemplate embed.FS

//go:generate /bin/sh -c "tar --exclude '*~' --exclude '*README.md' -C ./scripts -zcf app-scripts.tar.gz ."
//go:embed app-scripts.tar.gz
var scripts embed.FS

func trimExt(fileName string) string {
	return filepath.Join(
		filepath.Dir(fileName),
		strings.TrimSuffix(filepath.Base(fileName), filepath.Ext(fileName)),
	)
}

func stageAppTemplate() (string, error) {
	if dir, err := ioutil.TempDir("", "lunchpail"); err != nil {
		return "", err
	} else if err := Expand(dir, appTemplate, "app.tar.gz", false); err != nil {
		return "", err
	} else {
		return dir, nil
	}
}

func copyAppIntoTemplate(appname, sourcePath, templatePath, branch string, verbose bool) error {
	templatedir := filepath.Join(templatePath, "templates")
	appdir := filepath.Join(templatedir, appname)

	if strings.HasPrefix(sourcePath, "git@") {
		if os.Getenv("CI") != "" && os.Getenv("AI_FOUNDATION_GITHUB_USER") != "" {
			// git@github.ibm.com:user/repo.git -> https://patuser:pat@github.ibm.com/user/repo.git
			pattern := regexp.MustCompile("^git@([^:]+):([^/]+)/([^.]+)[.]git$")
			// apphttps := $(echo $appgit | sed -E "s#^git\@([^:]+):([^/]+)/([^.]+)[.]git\$#https://${AI_FOUNDATION_GITHUB_USER}:${AI_FOUNDATION_GITHUB_PAT}@\1/\2/\3.git#")
			sourcePath = pattern.ReplaceAllString(
				sourcePath,
				"https://"+os.Getenv("AI_FOUNDATION_GITHUB_USER")+":"+os.Getenv("AI_FOUNDATION_GITHUB_PAT")+"@$1/$2/$3.git",
			)
		}

		branchArg := ""
		if branch != "" {
			branchArg = "--branch=" + branch
		}
		cmd := exec.Command("git", "clone", sourcePath, branchArg, appname)
		cmd.Dir = filepath.Dir(appdir)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Start(); err != nil {
			return err
		}
		if err := cmd.Wait(); err != nil {
			return err
		}
	} else {
		os.MkdirAll(appdir, 0755)

		// TODO port this to pure go?
		cmd := exec.Command("sh", "-c", "tar --exclude '*~' -C "+sourcePath+" -cf - . | tar -C "+appdir+" -xf -")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			return err
		}
	}

	appSrc := filepath.Join(appdir, "src")
	if _, err := os.Stat(appSrc); err == nil {
		// then there is a src directory that we need to move
		// out of the template/ directory (this is a helm
		// thing)
		templateSrc := filepath.Join(templatePath, "src")
		os.MkdirAll(templateSrc, 0755)
		entries, err := os.ReadDir(appSrc)
		if err != nil {
			return err
		}
		for _, entry := range entries {
			sourcePath := filepath.Join(appSrc, entry.Name())
			destPath := filepath.Join(templateSrc, entry.Name())
			if verbose {
				fmt.Fprintf(os.Stderr, "Injecting application source %s -> %s %v\n", sourcePath, destPath, entry)
			}
			os.Rename(sourcePath, destPath)
		}
		if err := os.Remove(appSrc); err != nil {
			return err
		}
	}

	appValues := filepath.Join(appdir, "values.yaml")
	if _, err := os.Stat(appValues); err == nil {
		// then there is a values.yaml that we need to
		// consolidate
		if reader, err := os.Open(appValues); err != nil {
			return err
		} else {
			defer reader.Close()
			templateValues := filepath.Join(templatePath, "values.yaml")
			if writer, err := os.OpenFile(templateValues, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644); err != nil {
				return err
			} else {
				io.Copy(writer, reader)
				defer writer.Close()
			}
		}
	}

	return nil
}

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
		runname = truncate(runname+"-"+id.String(), 53)
	}

	return runname, nil
}

// Inject Run or WorkDispatcher resources if needed
func injectAutoRun(appname, templatePath string) (string, []string, error) {
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
		fmt.Println("Auto-Injecting WorkStealer initiation")
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
			fmt.Println("Auto-Injecting WorkDispatcher")
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

// return (appname, namespace, error)
func GenerateAppYaml(sourcePath, outputPath string, opts AppOptions) (string, string, error) {
	if _, err := os.Stat(outputPath); err == nil {
		if !opts.Force {
			return "", "", fmt.Errorf("Specified output directly already exists: %v", outputPath)
		} else {
			os.RemoveAll(outputPath)
		}
	}

	templatePath, err := stageAppTemplate()
	if err != nil {
		return "", "", err
	}

	// TODO... how do we really want to get a good name for the app?
	appname := opts.AppName
	if appname == "" {
		// try to infer appname
		appname = filepath.Base(trimExt(sourcePath))
	}
	if appname == "pail" {
		appname = filepath.Base(filepath.Dir(trimExt(sourcePath)))
	}

	if err := copyAppIntoTemplate(appname, sourcePath, templatePath, opts.Branch, opts.Verbose); err != nil {
		return "", "", err
	}

	runname, extraValues, err := injectAutoRun(appname, templatePath)
	if err != nil {
		return "", "", err
	} else {
		opts.OverrideValues = append(opts.OverrideValues, extraValues...)

	}

	namespace := opts.Namespace
	if namespace == "" {
		namespace = appname
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
		return "", "", ipsErr
	}

	user, err := user.Current()
	if err != nil {
		return "", "", err
	}

	// the app.kubernetes.io/part-of label value
	partOf := appname

	// name of taskqueue Secret
	taskqueueName := "defaultjaasqueue" // TODO externalize string
	taskqueueSecret := taskqueueName + "jaassecret"
	if opts.Queue != "" {
		taskqueueName = opts.Queue
		taskqueueSecret = opts.Queue + "jaassecret" // FIXME
	}

	yaml := fmt.Sprintf(`
global:
  type: %s # clusterType (1)
  rbac:
    serviceaccount: %s # clusterName (2)
  image:
    registry: %s # imageRegistry (3)
    repo: %s # imageRepo (4)
  jaas:
    ips: %s # imagePullSecretName (5)
    dockerconfigjson: %s # dockerconfigjson (6)
  s3Endpoint: http://s3.%v.svc.cluster.local:9000 # systemNamespace (7)
  s3AccessKey: lunchpail
  s3SecretKey: lunchpail
lunchpail: lunchpail
workdir_via_mount: %v # workdirViaMount (8)
branch: %s # opts.Branch (9)
username: %s # user.Username (10)
uid: %s # user.Uid (11)
mcad:
  enabled: false
rbac:
  serviceaccount: %s # clusterName (12)
image:
  registry: %s # imageRegistry (13)
  repo: %s # imageRepo (14)
  version: %v # lunchpail.Version() (15)
partOf: %s # partOf (16)
taskqueue:
  dataset: %s # taskqueueName (17)
  secret: %s # taskqueueSecret (18)
name: %s # runname (19)
`, clusterType, clusterName, imageRegistry, imageRepo, imagePullSecretName, dockerconfigjson, systemNamespace, opts.WorkdirViaMount, opts.Branch, user.Username, user.Uid, clusterName, imageRegistry, imageRepo, lunchpail.Version(), partOf, taskqueueName, taskqueueSecret, runname)

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "shrinkwrap app values=%s\n", yaml)
		fmt.Fprintf(os.Stderr, "shrinkwrap app overrides=%v\n", opts.OverrideValues)
	}

	chartSpec := helmclient.ChartSpec{
		ReleaseName: appname,
		ChartName:   templatePath,
		Namespace:   namespace,
		ValuesYaml:  yaml,
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

	helmClient, newClientErr := helmclient.New(&helmclient.Options{})
	if newClientErr != nil {
		return "", "", newClientErr
	}

	if res, err := helmClient.TemplateChart(&chartSpec, options); err != nil {
		return "", "", err
	} else {
		outputYamlPath := filepath.Join(outputPath, appname+".yml")

		if err := os.MkdirAll(outputPath, 0755); err != nil {
			return "", "", err
		} else if err := os.WriteFile(outputYamlPath, res, 0644); err != nil {
			return "", "", err
		}

		nsPath := filepath.Join(
			filepath.Dir(outputYamlPath),
			strings.TrimSuffix(filepath.Base(outputYamlPath), filepath.Ext(outputYamlPath))+".namespace",
		)
		if err := os.WriteFile(nsPath, []byte(namespace), 0644); err != nil {
			return "", "", err
		}
	}

	if err := Expand(outputPath, scripts, "app-scripts.tar.gz", false); err != nil {
		return "", "", err
	}
	updateScripts(outputPath, appname, runname, namespace, systemNamespace)

	// defer os.RemoveAll(templatePath)
	return appname, namespace, nil
}

func App(sourcePath, outputPath string, opts AppOptions) error {
	_, namespace, err := GenerateAppYaml(sourcePath, outputPath, opts)
	if err != nil {
		return err
	}

	return GenerateCoreYaml(outputPath, CoreOptions{namespace, opts.ClusterIsOpenShift, opts.NeedsCsiH3, opts.NeedsCsiS3, opts.NeedsCsiNfs, opts.HasGpuSupport, opts.DockerHost, opts.OverrideValues, opts.ImagePullSecret, opts.Verbose})
}

// hack, we still use sed here to update the script templates
func updateScripts(path, appname, runname, userNamespace, systemNamespace string) error {
	return filepath.Walk(
		path,
		func(path string, info fs.FileInfo, err error) error {
			if !info.IsDir() && filepath.Ext(path) != ".namespace" && filepath.Ext(path) != "yml" && filepath.Ext(path) != ".tmp" && filepath.Ext(path) != ".DS_Store" {
				// TODO: ugh sed
				sed := "cat " + path + " | sed 's#the_lunchpail_app#" + appname + "#g' | sed 's#the_lunchpail_run#" + runname + "#g' | sed 's#jaas-user#" + userNamespace + "#g' | sed 's#jaas-system#" + systemNamespace + "#g' > " + path + ".tmp && mv " + path + ".tmp " + path + " && chmod +x " + path
				cmd := exec.Command("sh", "-c", sed)
				cmd.Stdout = os.Stdout
				cmd.Stderr = os.Stderr
				if err := cmd.Run(); err != nil {
					return err
				}
			}
			return nil
		})
}
