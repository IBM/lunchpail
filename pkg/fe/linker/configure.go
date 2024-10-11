package linker

import (
	"fmt"
	"os"
	"os/user"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/lunchpail"
)

func Configure(appname, runname string, opts build.Options) (string, error) {
	user, err := user.Current()
	if err != nil {
		return "", err
	}

	yaml := fmt.Sprintf(`
lunchpail:
  user:
    name: %s # user.Username (10)
    uid: %s # user.Uid (11)
  image:
    registry: %s # (12)
    repo: %s # (13)
    version: %s # (14)
  name: %s # runname (23)
  partOf: %s # appname (16)
`,
		user.Username,           // (10)
		user.Uid,                // (11)
		lunchpail.ImageRegistry, // (12)
		lunchpail.ImageRepo,     // (13)
		lunchpail.Version(),     // (14)
		runname,                 // (23)
		appname,                 // (16)
	)

	if opts.Log.Verbose {
		fmt.Fprintf(os.Stderr, "shrinkwrap app values=%s\n", yaml)
	}

	return yaml, nil
}
