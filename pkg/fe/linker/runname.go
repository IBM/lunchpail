package linker

import (
	"github.com/google/uuid"
	"lunchpail.io/pkg/util"
	"strings"
)

func GenerateRunName(appname string) (string, error) {
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

		runname = util.Truncate(runname+"-"+ids, 53)
	}

	return runname, nil
}
