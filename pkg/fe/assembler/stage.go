package assembler

import (
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"

	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/util"
)

func StageTemplate() (string, error) {
	if dir, err := ioutil.TempDir("", "lunchpail"); err != nil {
		return "", err
	} else if err := util.Expand(dir, appTemplate, "charts.tar.gz"); err != nil {
		return "", err
	} else {
		return dir, nil
	}
}

func Appdir(templatePath string) string {
	return filepath.Join(templatePath, "templates/__embededapp__")
}

func copyAppIntoTemplate(appname, sourcePath, templatePath, branch string, verbose bool) error {
	appdir := Appdir(templatePath)
	if verbose {
		fmt.Fprintf(os.Stderr, "Copying app templates into %s\n", appdir)
	}

	isGitSsh := strings.HasPrefix(sourcePath, "git@")
	isGitHttp := !isGitSsh && strings.HasPrefix(sourcePath, "https:")
	if isGitSsh || isGitHttp {
		if isGitSsh && os.Getenv("CI") != "" && os.Getenv("AI_FOUNDATION_GITHUB_USER") != "" {
			// git@github.ibm.com:user/repo.git -> https://patuser:pat@github.ibm.com/user/repo.git
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
			return err
		}
		if err := cmd.Wait(); err != nil {
			return err
		}
		fmt.Fprintln(os.Stderr, " done")
	} else {
		os.MkdirAll(appdir, 0755)

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
			return err
		}
	}

	// if the app has a .helmignore file, append it to the one in the template
	appHelmignore := filepath.Join(appdir, ".helmignore")
	if _, err := os.Stat(appHelmignore); err == nil {
		fmt.Fprintf(os.Stderr, "Including application helmignore\n")
		templateHelmignore := filepath.Join(templatePath, ".helmignore")
		if err := util.AppendFile(templateHelmignore, appHelmignore); err != nil {
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
				os.Remove(appValues) // otherwise fe/parser/parse will think this is an invalid resource yaml
				defer writer.Close()
			}
		}
	}

	return nil
}

type StageOptions struct {
	Branch  string
	Verbose bool
}

// return (templatePath, error)
func StagePath(appname, sourcePath string, opts StageOptions) (string, error) {
	templatePath, err := StageTemplate()
	if err != nil {
		return "", err
	}

	if sourcePath != "" {
		if err := copyAppIntoTemplate(appname, sourcePath, templatePath, opts.Branch, opts.Verbose); err != nil {
			return "", err
		}
	}

	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Finished staging to %s\n", templatePath)
	}

	return templatePath, nil
}

// return (appname, templatePath, error)
func Stage(opts StageOptions) (string, string, error) {
	appname := assembly.Name()
	templatePath, err := StagePath(appname, "", opts)

	return appname, templatePath, err
}
