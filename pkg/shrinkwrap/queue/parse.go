package queue

import (
	"strconv"
	"strings"
)

func ParseFlag(flag, runname string, internalS3Port int) (Spec, error) {
	spec := Spec{
		flag,  // name
		false, // auto
		flag,  // bucket
		"",    // endpoint
		"",    // accessKey
		"",    // secretKey
	}

	if _, err := parseFlagAsRclone(flag, &spec); err != nil {
		return Spec{}, err
	}

	if spec.Name == "" {
		// create a queue resource (since one was not
		// supplied). re: name of taskqueue Secret; dashes are
		// not valid in bash variable names, so we avoid those
		// here
		spec.Name = strings.Replace(runname, "-", "", -1) + "queue"
		spec.Auto = true
	}

	if strings.Contains(spec.Endpoint, "$TEST_RUN") {
		// helpful for tests, which want to point to the
		// internal s3 whose service name isn't known ahead of
		// time -- it includes the run name
		spec.Endpoint = strings.Replace(spec.Endpoint, "$TEST_RUN", runname, -1)
	}

	if strings.Contains(spec.Endpoint, "$TEST_PORT") {
		// helpful for tests, which want to point to the
		// internal s3 whose service name isn't known ahead of
		// time -- it includes the run name
		spec.Endpoint = strings.Replace(spec.Endpoint, "$TEST_PORT", strconv.Itoa(internalS3Port), -1)
	}

	if strings.Contains(spec.AccessKey, "$TEST_ACCESSKEY") {
		// helpful for tests, which want to point to the
		// internal s3 whose service name isn't known ahead of
		// time -- it includes the run name
		spec.AccessKey = strings.Replace(spec.AccessKey, "$TEST_ACCESSKEY", "lunchpail", -1)
	}

	if strings.Contains(spec.SecretKey, "$TEST_SECRETKEY") {
		// helpful for tests, which want to point to the
		// internal s3 whose service name isn't known ahead of
		// time -- it includes the run name
		spec.SecretKey = strings.Replace(spec.SecretKey, "$TEST_SECRETKEY", "lunchpail", -1)
	}

	return spec, nil
}
