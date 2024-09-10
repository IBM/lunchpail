package queue

import (
	"fmt"
	"os"
	"regexp"
	"strings"

	rcloneConfig "github.com/rclone/rclone/fs/config"
	rcloneConfigFile "github.com/rclone/rclone/fs/config/configfile"
)

func SpecFromRcloneRemoteName(remoteName, bucket, runname string, internalS3Port int) (bool, Spec, error) {
	spec := Spec{
		// re: name of taskqueue Secret; dashes are
		// not valid in bash variable names, so we avoid those
		// here
		Name(runname),  // Name
		true,           // Auto
		bucket,         // Bucket
		"",             // Endpoint
		internalS3Port, // Port
		"",             // AccessKey
		"",             // SecretKey
	}

	if os.Getenv("RCLONE_CONFIG") != "" {
		// sigh, rclone doesn't seem to support this except at the level of the rclone CLI
		if err := rcloneConfig.SetConfigPath(os.Getenv("RCLONE_CONFIG")); err != nil {
			return false, Spec{}, err
		}
	}
	rcloneConfigFile.Install() // otherwise, DumpRcRemote() yields an empty map
	config := rcloneConfig.DumpRcRemote(remoteName)

	if maybe, ok := config["endpoint"]; !ok {
		return false, Spec{}, fmt.Errorf("Rclone config '%s' is missing endpoint %v || %v", remoteName, config, rcloneConfig.LoadedData())
	} else if s, ok := maybe.(string); !ok {
		return false, Spec{}, fmt.Errorf("Rclone config '%s' has invalid endpoint value: '%s'", remoteName, maybe)
	} else {
		spec.Endpoint = s
		if !isInternalS3(s) {
			spec.Auto = false
		}
	}

	if maybe, ok := config["access_key_id"]; !ok {
		return false, Spec{}, fmt.Errorf("Rclone config '%s' is missing access_key_id", remoteName)
	} else if s, ok := maybe.(string); !ok {
		return false, Spec{}, fmt.Errorf("Rclone config '%s' has invalid access_key_id value: '%s'", remoteName, maybe)
	} else {
		spec.AccessKey = s
	}

	if maybe, ok := config["secret_access_key"]; !ok {
		return false, Spec{}, fmt.Errorf("Rclone config '%s' is missing secret_access_key", remoteName)
	} else if s, ok := maybe.(string); !ok {
		return false, Spec{}, fmt.Errorf("Rclone config '%s' has invalid secret_access_key value: '%s'", remoteName, maybe)
	} else {
		spec.SecretKey = s
	}

	if spec.Endpoint == "" || spec.Endpoint == "$TEST_QUEUE_ENDPOINT" {
		spec.Auto = true
	}

	if strings.Contains(spec.AccessKey, "$TEST_QUEUE_ACCESSKEY") {
		// helpful for tests, which want to point to the
		// internal s3 whose service name isn't known ahead of
		// time -- it includes the run name
		spec.AccessKey = strings.Replace(spec.AccessKey, "$TEST_QUEUE_ACCESSKEY", "lunchpail", -1)
	}

	if strings.Contains(spec.SecretKey, "$TEST_QUEUE_SECRETKEY") {
		// helpful for tests, which want to point to the
		// internal s3 whose service name isn't known ahead of
		// time -- it includes the run name
		spec.SecretKey = strings.Replace(spec.SecretKey, "$TEST_QUEUE_SECRETKEY", "lunchpail", -1)
	}

	return true, spec, nil
}

// return (isSpecValidAsRclone?, error)
func parseFlagAsRclone(flag, runname string, internalS3Port int) (bool, Spec, error) {
	rclonePattern := regexp.MustCompile("^rclone://([^/]+)/(.+)$")
	if match := rclonePattern.FindStringSubmatch(flag); len(match) == 3 {
		return SpecFromRcloneRemoteName(match[1], match[2], runname, internalS3Port)
	} else if strings.HasPrefix(flag, "rclone:") {
		return false, Spec{}, fmt.Errorf("Invalid --queue option. Must be of the form 'rclone://configname/bucketname'")
	}

	return false, Spec{Name: strings.Replace(runname, "-", "", -1) + "queue"}, nil
}

// Follow convention for internalS3 name in charts/workstealer/templates/s3 below.
// Checks if hostname ends with the same suffix to determine if internalS3.
func isInternalS3(endpoint string) bool {
	internalS3Suffix := "-minio"
	return strings.HasSuffix(strings.Split(endpoint, ".")[0], internalS3Suffix)
}
