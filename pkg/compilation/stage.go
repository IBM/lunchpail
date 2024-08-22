package compilation

import (
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"

	"lunchpail.io/pkg/util"
)

func appdir(templatePath string) string {
	return filepath.Join(templatePath, "templates/__embededapp__")
}

func copyAppIntoTemplate(appname, sourcePath, templatePath, branch string, verbose bool) (string, error) {
	appdir := appdir(templatePath)
	if verbose {
		fmt.Fprintf(os.Stderr, "Copying app templates into %s\n", appdir)
	}
	os.MkdirAll(appdir, 0755)

	isGitSsh := strings.HasPrefix(sourcePath, "git@")
	isGitHttp := !isGitSsh && strings.HasPrefix(sourcePath, "https:")
	if isGitSsh || isGitHttp {
		if isGitSsh && os.Getenv("CI") != "" && os.Getenv("AI_FOUNDATION_GITHUB_USER") != "" {
			// git@github.com:user/repo.git -> https://patuser:pat@github.com/user/repo.git
			pattern := regexp.MustCompile("^git@([^:]+):([^/]+)/([^.]+)[.]git$")
			// apphttps := $(echo $appgit | sed -E "s#^git\@([^:]+):([^/]+)/([^.]+)[.]git\$#https://${AI_FOUNDATION_GITHUB_USER}:${AI_FOUNDATION_GITHUB_PAT}@\1/\2/\3.git#")
			sourcePath = pattern.ReplaceAllString(
				sourcePath,
				"https://"+os.Getenv("AI_FOUNDATION_GITHUB_USER")+":"+os.Getenv("AI_FOUNDATION_GITHUB_PAT")+"@$1/$2/$3.git",
			)
		}

		quietArg := "-q"
		if verbose {
			quietArg = ""
		}

		branchArg := ""
		if branch != "" {
			branchArg = "--branch=" + branch
		}
		fmt.Fprintf(os.Stderr, "Cloning application repository...")
		cmd := exec.Command("/bin/sh", "-c", "git clone --depth=1 "+sourcePath+" "+branchArg+" "+quietArg+" "+filepath.Base(appdir))
		cmd.Dir = filepath.Dir(appdir)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Start(); err != nil {
			return "", err
		}
		if err := cmd.Wait(); err != nil {
			return "", err
		}
		fmt.Fprintln(os.Stderr, " done")
	} else {
		// TODO port this to pure go?
		verboseFlag := ""
		if verbose {
			verboseFlag = " -v "
		}
		cmdline := "tar --exclude '*~' -C " + sourcePath + verboseFlag + " -cf - . | tar -C " + appdir + verboseFlag + " -xf -"
		if verbose {
			fmt.Fprintf(os.Stderr, "Using tar to inject source: %s\n", cmdline)
		}

		cmd := exec.Command("sh", "-c", "tar --exclude '*~' -C "+sourcePath+verboseFlag+" -cf - . | tar -C "+appdir+verboseFlag+" -xf -")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			return "", err
		}
	}

	// check if the app has a version file
	appVersion := ""
	appVersionFile := filepath.Join(appdir, "version")
	if _, err := os.Stat(appVersionFile); err == nil {
		versionBytes, err := os.ReadFile(appVersionFile)
		if err != nil {
			return "", err
		}
		appVersion = strings.TrimSpace(string(versionBytes))

		if err := os.Remove(appVersionFile); err != nil {
			return "", err
		}
	}

	// if the app has a .helmignore file, append it to the one in the template
	appHelmignore := filepath.Join(appdir, ".helmignore")
	if _, err := os.Stat(appHelmignore); err == nil {
		fmt.Fprintf(os.Stderr, "Including application helmignore\n")
		templateHelmignore := filepath.Join(templatePath, ".helmignore")
		if err := util.AppendFile(templateHelmignore, appHelmignore); err != nil {
			return "", err
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
			return "", err
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
			return "", err
		}
	}

	appValues := filepath.Join(appdir, "values.yaml")
	if _, err := os.Stat(appValues); err == nil {
		// then there is a values.yaml that we need to
		// consolidate
		if reader, err := os.Open(appValues); err != nil {
			return "", err
		} else {
			defer reader.Close()
			templateValues := filepath.Join(templatePath, "values.yaml")
			if writer, err := os.OpenFile(templateValues, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644); err != nil {
				return "", err
			} else {
				io.Copy(writer, reader)
				os.Remove(appValues) // otherwise fe/parser/parse will think this is an invalid resource yaml
				defer writer.Close()
			}
		}
	}

	return appVersion, nil
}

type StageOptions struct {
	Branch  string
	Verbose bool
}

// return (templatePath, appVersion, error)
func StagePath(appname, sourcePath string, opts StageOptions) (string, string, error) {
	appVersion := AppVersion()

	// TODO overlay on kube/common?
	templatePath, err := ioutil.TempDir("", "lunchpail")
	if err != nil {
		return "", "", err

	} else if err := util.Expand(templatePath, appTemplate, appTemplateFile); err != nil {
		return "", "", err
	}

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Application source stage dir=%s\n", templatePath)
	}

	if sourcePath != "" {
		if version, err := copyAppIntoTemplate(appname, sourcePath, templatePath, opts.Branch, opts.Verbose); err != nil {
			return "", "", err
		} else {
			appVersion = version
		}
	}

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Finished staging application to %s\n", templatePath)
	}

	return templatePath, appVersion, nil
}

// return (appname, templatePath, appVersion, error)
func Stage(opts StageOptions) (string, string, string, error) {
	appname := Name()
	templatePath, appVersion, err := StagePath(appname, "", opts)

	if err := dropChartYaml(templatePath); err != nil {
		return "", "", "", err
	}

	return appname, templatePath, appVersion, err
}

// This is just to make helmClient.Template happy.
func dropChartYaml(templatePath string) error {
	chartYaml := `
apiVersion: v1
name: lunchpail
type: application
version: 0.0.1
appVersion: 0.0.1`
	return os.WriteFile(filepath.Join(templatePath, "Chart.yaml"), []byte(chartYaml), 0644)
}

// Reverse of Stage(), store a staged local filesystem in the "right
// place" so that future calls to Stage() will pick up the changes
func MoveAppTemplateIntoLunchpailStage(lunchpailStageDir, appTemplatePath string, verbose bool) error {
	tarball := filepath.Join(lunchpailStageDir, embededTemplatePath)
	verboseFlag := ""
	if verbose {
		verboseFlag = "-v"
		fmt.Fprintf(os.Stderr, "Transferring staged app template to final stage %s -> %s\n", appTemplatePath, tarball)
	}

	cmd := exec.Command("tar", verboseFlag, "-zcf", tarball, "--exclude", "LICENSE", "--exclude", "*.git*", "-C", appTemplatePath, ".")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}
