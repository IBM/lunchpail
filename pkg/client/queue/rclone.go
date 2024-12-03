package queue

import (
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"

	rcloneConfig "github.com/rclone/rclone/fs/config"
	rcloneConfigFile "github.com/rclone/rclone/fs/config/configfile"

	"lunchpail.io/pkg/ir/queue"
)

func AccessQueue(flag string) (queue.Spec, error) {

	isRclone, spec, err := parseFlagAsRclone(flag)

	if err != nil {
		return queue.Spec{}, err
	} else if flag != "" && !isRclone {
		return queue.Spec{}, fmt.Errorf("Unsupported scheme for queue: '%s'", flag)
	}

	return spec, nil
}

func specFromRcloneRemoteName(remoteName, bucket string) (bool, queue.Spec, error) {
	spec := queue.Spec{
		Auto:   true,
		Bucket: bucket,
	}

	if os.Getenv("RCLONE_CONFIG") != "" {
		if err := rcloneConfig.SetConfigPath(os.Getenv("RCLONE_CONFIG")); err != nil {
			return false, queue.Spec{}, err
		}
	}
	rcloneConfigFile.Install() // otherwise, DumpRcRemote() yields an empty map
	config := rcloneConfig.DumpRcRemote(remoteName)

	if maybe, ok := config["endpoint"]; !ok {
		return false, queue.Spec{}, fmt.Errorf("Rclone config '%s' is missing endpoint %v || %v", remoteName, config, rcloneConfig.LoadedData())
	} else if s, ok := maybe.(string); !ok {
		return false, queue.Spec{}, fmt.Errorf("Rclone config '%s' has invalid endpoint value: '%s'", remoteName, maybe)
	} else {
		spec.Endpoint = s
		words := strings.Split(spec.Endpoint, ":")
		if len(words) == 3 {
			p, err := strconv.Atoi(words[2])
			if err != nil {
				return false, queue.Spec{}, err
			}
			spec.Port = p
		}
		if !isInternalS3(s) {
			spec.Auto = false
		}
	}

	if maybe, ok := config["access_key_id"]; !ok {
		return false, queue.Spec{}, fmt.Errorf("Rclone config '%s' is missing access_key_id", remoteName)
	} else if s, ok := maybe.(string); !ok {
		return false, queue.Spec{}, fmt.Errorf("Rclone config '%s' has invalid access_key_id value: '%s'", remoteName, maybe)
	} else {
		spec.AccessKey = s
	}

	if maybe, ok := config["secret_access_key"]; !ok {
		return false, queue.Spec{}, fmt.Errorf("Rclone config '%s' is missing secret_access_key", remoteName)
	} else if s, ok := maybe.(string); !ok {
		return false, queue.Spec{}, fmt.Errorf("Rclone config '%s' has invalid secret_access_key value: '%s'", remoteName, maybe)
	} else {
		spec.SecretKey = s
	}

	if spec.Endpoint == "" || spec.Endpoint == "$TEST_QUEUE_ENDPOINT" {
		spec.Auto = true
	}

	if strings.Contains(spec.AccessKey, "$TEST_QUEUE_ACCESSKEY") {
		spec.AccessKey = strings.Replace(spec.AccessKey, "$TEST_QUEUE_ACCESSKEY", "lunchpail", -1)
	}

	if strings.Contains(spec.SecretKey, "$TEST_QUEUE_SECRETKEY") {
		spec.SecretKey = strings.Replace(spec.SecretKey, "$TEST_QUEUE_SECRETKEY", "lunchpail", -1)
	}

	return true, spec, nil
}

func parseFlagAsRclone(flag string) (bool, queue.Spec, error) {
	rclonePattern := regexp.MustCompile("^rclone://([^/]+)/(.+)$")
	if match := rclonePattern.FindStringSubmatch(flag); len(match) == 3 {
		return specFromRcloneRemoteName(match[1], match[2])
	} else if strings.HasPrefix(flag, "rclone:") {
		return false, queue.Spec{}, fmt.Errorf("Invalid --queue option. Must be of the form 'rclone://configname/bucketname'")
	}

	return false, queue.Spec{}, nil
}

// Follow convention for internalS3 name in charts/workstealer/templates/s3 below.
// Checks if hostname ends with the same suffix to determine if internalS3.
func isInternalS3(endpoint string) bool {
	internalS3Suffix := "-minio"
	return strings.HasSuffix(strings.Split(endpoint, ".")[0], internalS3Suffix)
}
