package queue

import (
	"fmt"
	"os"
	"strconv"
)

func LoadRunContextInsideComponent(runname string) (run RunContext, err error) {
	if runname != "" {
		run = RunContext{RunName: runname}
		return
	}

	runname = os.Getenv("LUNCHPAIL_RUN_NAME")
	bucket := os.Getenv("LUNCHPAIL_QUEUE_BUCKET")
	stepStr := os.Getenv("LUNCHPAIL_STEP")

	switch {
	case runname == "":
		err = fmt.Errorf("Missing LUNCHPAIL_RUN_NAME environment variable")
	case bucket == "":
		err = fmt.Errorf("Missing LUNCHPAIL_QUEUE_BUCKET environment variable")
		return
	case stepStr == "":
		err = fmt.Errorf("Missing LUNCHPAIL_STEP environment variable")
		return
	}

	var step int
	step, err = strconv.Atoi(stepStr)
	if err != nil {
		return
	}

	run = RunContext{RunName: runname, Bucket: bucket, Step: step}
	return
}
