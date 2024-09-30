package builder

import (
	"path/filepath"
	"regexp"

	"lunchpail.io/pkg/build"
)

// Determine a name for the build
func buildNameFrom(sourcePath string) (buildName string) {
	// Fallback: use name from prior build that we may be
	// overlaying new values on top of
	buildName = build.Name()

	if sourcePath != "" {
		// If we were given a sourcePath to overlay, then
		// infer a build name from the source path
		buildName = filepath.Base(trimExt(sourcePath))
	}

	// Hmm, a bit of a hack for the tests...
	if buildName == "pail" {
		buildName = filepath.Base(filepath.Dir(trimExt(sourcePath)))
		if buildName == "pail" {
			// probably a trailing slash
			buildName = filepath.Base(filepath.Dir(filepath.Dir(trimExt(sourcePath))))
		}
	}

	// Neither kubernetes (for resource names) nor s3 (for bucket
	// names) is happy with underscores, so let's just replace
	// them with dashes right up front
	buildName = regexp.MustCompile("_").ReplaceAllString(buildName, "-") // replace _ with -

	return
}
