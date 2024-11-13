package llir

import (
	"time"

	"lunchpail.io/pkg/build"
)

type Options struct {
	build.Options
	UpStartTime time.Time
}
