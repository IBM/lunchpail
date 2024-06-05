package api

import (
	"embed"
	"io/ioutil"
	"lunchpail.io/pkg/util"
)

func Stage(fs embed.FS, file string) (string, error) {
	if dir, err := ioutil.TempDir("", "lunchpail"); err != nil {
		return "", err
	} else if err := util.Expand(dir, fs, file); err != nil {
		return "", err
	} else {
		return dir, nil
	}
}
