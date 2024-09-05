package util

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

func SleepyTime(envvar string, defaultValue int) (time.Duration, error) {
	t := defaultValue
	if os.Getenv(envvar) != "" {
		if s, err := strconv.Atoi(os.Getenv(envvar)); err != nil {
			return time.Second, fmt.Errorf("%s not an integer: %s", envvar, os.Getenv(envvar))
		} else {
			t = s
		}
	}

	return time.Duration(t) * time.Second, nil
}

// If tests need to capture some output before we exit, they can
// increase this. Otherwise, we will have a default grace period to
// allow for UIs e.g. to do a last poll of queue info.
func SleepBeforeExit() error {
	if duration, err := SleepyTime("LUNCHPAIL_SLEEP_BEFORE_EXIT", 10); err != nil {
		return err
	} else {
		time.Sleep(duration)
	}
	return nil
}
