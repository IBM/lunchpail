package shrinkwrap

import (
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

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
		cmd := exec.Command("/bin/sh", "-c", "git clone " + sourcePath + " " + branchArg + " " + appname)
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

	// if the app has a .helmignore file, append it to the one in the template
	appHelmignore := filepath.Join(appdir, ".helmignore")
	if _, err := os.Stat(appHelmignore); err == nil {
		fmt.Fprintf(os.Stderr, "Including application helmignore\n")
		templateHelmignore := filepath.Join(templatePath, ".helmignore")
		if err := AppendFile(templateHelmignore, appHelmignore); err != nil {
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

type StageOptions struct {
	AppName string
	Branch string
	Verbose bool
}

// return (appname, templatePath, error)
func Stage(sourcePath string, opts StageOptions) (string, string, error) {
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


	return appname, templatePath, nil
}
