package shrinkwrap

import (
	"embed"
	b64 "encoding/base64"
	"fmt"
	"github.com/mittwald/go-helm-client"
	"github.com/mittwald/go-helm-client/values"
	"helm.sh/helm/v3/pkg/chartutil"
	"io"
	"io/fs"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	//	"github.com/go-git/go-git/v5"
)

type AppOptions struct {
	Namespace          string
	AppName            string
	ClusterIsOpenShift bool
	WorkdirViaMount    bool
	ImagePullSecret    string
	Branch             string
	OverrideValues     []string
}

//go:generate /bin/sh -c "tar --exclude '*~' --exclude '*README.md' -C ../../templates/app -zcf app.tar.gz ."
//go:embed app.tar.gz
var appTemplate embed.FS

//go:generate /bin/sh -c "tar --exclude '*~' --exclude '*README.md' -C ../../hack/shrinkwrap/scripts -zcf app-scripts.tar.gz ."
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
	} else if err := expand(dir, appTemplate, "app.tar.gz"); err != nil {
		return "", err
	} else {
		return dir, nil
	}
}

func copyAppIntoTemplate(appname, sourcePath, templatePath, branch string) error {
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

// Inject Run or WorkDispatcher resources if needed
func injectAutoRun(appname, templatePath string) ([]string, error) {
	sets := []string{}
	appdir := filepath.Join(templatePath, "templates", appname)

	// TODO port this to pure go?
	cmd := exec.Command("grep", "-qr", "^kind:[[:space:]]*Run$", appdir)
	if err := cmd.Start(); err != nil {
		return []string{}, err
	}
	if err := cmd.Wait(); err != nil {
		fmt.Println("Auto-Injecting WorkStealer initiation")
		sets = append(sets, "autorun="+appname)
	}

	// TODO port this to pure go?
	cmd2 := exec.Command("grep", "-qr", "^kind:[[:space:]]*WorkDispatcher$", appdir)
	if err := cmd2.Start(); err != nil {
		return []string{}, err
	}
	if err := cmd2.Wait(); err != nil {
		// TODO port this to pure go?
		cmd3 := exec.Command("grep", "-qr", "^  role:[[:space:]]*dispatcher$", appdir)
		if err := cmd3.Start(); err != nil {
			return []string{}, err
		}
		if err := cmd3.Wait(); err == nil {
			fmt.Println("Auto-Injecting WorkDispatcher")
			sets = append(sets, "autodispatcher.name="+appname)
			sets = append(sets, "autodispatcher.application="+appname)
		}
	}

	return sets, nil
}

func App(sourcePath, outputPath string, opts AppOptions) error {
	if _, err := os.Stat(outputPath); err == nil {
		return fmt.Errorf("Specified output directly already exists: %v", outputPath)
	}

	templatePath, err := stageAppTemplate()
	if err != nil {
		return err
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

	if err := copyAppIntoTemplate(appname, sourcePath, templatePath, opts.Branch); err != nil {
		return err
	}

	if extraValues, err := injectAutoRun(appname, templatePath); err != nil {
		return err
	} else {
		opts.OverrideValues = append(opts.OverrideValues, extraValues...)

	}

	systemNamespace := "jaas-system" // TODO
	namespace := opts.Namespace
	if namespace == "" {
		namespace = appname
	}

	clusterName := "lunchpail"
	clusterType := "k8s"
	imageRegistry := "ghcr.io"
	imageRepo := "lunchpail"

	if opts.ClusterIsOpenShift {
		clusterType = "oc"
	}

	imagePullSecretName := ""
	dockerconfigjson := ""
	if opts.ImagePullSecret != "" {
		ipsPattern := regexp.MustCompile("^([^:]+):([^@]+)@(.+)$")

		if match := ipsPattern.FindStringSubmatch(opts.ImagePullSecret); len(match) != 3 {
			return fmt.Errorf("image pull secret option must be of the form <user>:<token>@github...com: %s", opts.ImagePullSecret)
		} else {
			registryUser := match[1]
			registryToken := match[2]
			imageRegistry := match[3]
			userColonToken := fmt.Sprintf("%s:%s", registryUser, registryToken)
			registryAuth := b64.StdEncoding.EncodeToString([]byte(userColonToken))
			imagePullSecretName = "lunchpail-image-pull-secret"
			dockerconfigjson = fmt.Sprintf(`
{       
    "auths":
    {
        "%s":
            {
                "auth":"%s"
            }
    }
}
`, imageRegistry, registryAuth)

		}
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
workdir_via_mount: %v # workdirViaMount (8)
`, clusterType, clusterName, imageRegistry, imageRepo, imagePullSecretName, dockerconfigjson, systemNamespace, opts.WorkdirViaMount)

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
		return newClientErr
	}

	if res, err := helmClient.TemplateChart(&chartSpec, options); err != nil {
		return err
	} else {
		outputYamlPath := filepath.Join(outputPath, appname+".yml")

		if err := os.MkdirAll(outputPath, 0755); err != nil {
			return err
		} else if err := os.WriteFile(outputYamlPath, res, 0644); err != nil {
			return err
		}

		nsPath := filepath.Join(
			filepath.Dir(outputYamlPath),
			strings.TrimSuffix(filepath.Base(outputYamlPath), filepath.Ext(outputYamlPath))+".namespace",
		)
		if err := os.WriteFile(nsPath, []byte(namespace), 0644); err != nil {
			return err
		}
	}

	if err := expand(outputPath, scripts, "app-scripts.tar.gz"); err != nil {
		return err
	}
	// hack:
	updateScripts(outputPath, appname, namespace, systemNamespace)

	defer os.RemoveAll(templatePath)
	return nil
}

func updateScripts(path, appname, userNamespace, systemNamespace string) error {
	return filepath.Walk(
		path,
		func(path string, info fs.FileInfo, err error) error {
			if !info.IsDir() && filepath.Ext(path) != ".namespace" && filepath.Ext(path) != "yml" {
				// TODO: ugh sed
				sed := "cat " + path + " | sed 's#the_lunchpail_app#" + appname + "#g' | sed 's#jaas-user#" + userNamespace + "#g' | sed 's#jaas-system#" + systemNamespace + "#g' > " + path + ".tmp && mv " + path + ".tmp " + path + " && chmod +x " + path
				cmd := exec.Command("sh", "-c", sed)
				if err := cmd.Run(); err != nil {
					return err
				}
			}
			return nil
		})
}
