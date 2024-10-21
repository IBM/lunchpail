package queue

import (
	"fmt"
	"math/rand"

	"lunchpail.io/pkg/ir/queue"
)

func ParseFlag(flag, runname string) (queue.Spec, error) {
	// Assign a port for the internal S3 (TODO: we only need to do
	// this if this run will be using an internal S3). We use the
	// range of "ephemeral"
	// ports. https://en.wikipedia.org/wiki/Ephemeral_bbport
	portMin := 49152
	portMax := 65535
	internalS3Port := rand.Intn(portMax-portMin+1) + portMin

	isRclone, spec, err := parseFlagAsRclone(flag, runname, internalS3Port)

	if err != nil {
		return queue.Spec{}, err
	} else if flag != "" && !isRclone {
		return queue.Spec{}, fmt.Errorf("Unsupported scheme for queue: '%s'", flag)
	}

	if spec.Endpoint == "" {
		// see charts/workstealer/templates/s3/service... the hostname of the service has a max length
		spec.Auto = true
		spec.Port = internalS3Port
		spec.Endpoint = fmt.Sprintf("localhost:%d", internalS3Port)
		spec.AccessKey = "lunchpail"
		spec.SecretKey = "lunchpail"
	}

	if spec.Bucket == "" {
		spec.Bucket = "lunchpail.io"
	}

	return spec, nil
}
