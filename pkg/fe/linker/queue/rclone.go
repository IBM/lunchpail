package queue

import (
	"fmt"
	"regexp"
	"strings"

	rcloneConfig "github.com/rclone/rclone/fs/config"
	rcloneConfigFile "github.com/rclone/rclone/fs/config/configfile"
)

// return (isSpecValidAsRclone?, error)
func parseFlagAsRclone(flag string, spec *Spec) (bool, error) {
	rclonePattern := regexp.MustCompile("^rclone://([^/]+)/(.+)$")
	if match := rclonePattern.FindStringSubmatch(flag); len(match) == 3 {
		spec.Auto = true
		rcloneRemote := match[1]
		spec.Bucket = match[2]
		spec.Name = "" // will be defined just after this block

		rcloneConfigFile.Install() // otherwise, DumpRcRemote() yields an empty map
		config := rcloneConfig.DumpRcRemote(rcloneRemote)

		if maybe, ok := config["endpoint"]; !ok {
			return false, fmt.Errorf("Rclone config '%s' is missing endpoint %v || %v", rcloneRemote, config, rcloneConfig.LoadedData())
		} else if s, ok := maybe.(string); !ok {
			return false, fmt.Errorf("Rclone config '%s' has invalid endpoint value: '%s'", rcloneRemote, maybe)
		} else {
			spec.Endpoint = s
			if !isInternalS3(s) {
				spec.Auto = false
			}
		}

		if maybe, ok := config["access_key_id"]; !ok {
			return false, fmt.Errorf("Rclone config '%s' is missing access_key_id", rcloneRemote)
		} else if s, ok := maybe.(string); !ok {
			return false, fmt.Errorf("Rclone config '%s' has invalid access_key_id value: '%s'", rcloneRemote, maybe)
		} else {
			spec.AccessKey = s
		}

		if maybe, ok := config["secret_access_key"]; !ok {
			return false, fmt.Errorf("Rclone config '%s' is missing secret_access_key", rcloneRemote)
		} else if s, ok := maybe.(string); !ok {
			return false, fmt.Errorf("Rclone config '%s' has invalid secret_access_key value: '%s'", rcloneRemote, maybe)
		} else {
			spec.SecretKey = s
		}

		return true, nil
	} else if strings.HasPrefix(flag, "rclone:") {
		return false, fmt.Errorf("Invalid --queue option. Must be of the form 'rclone://configname/bucketname'")
	}

	return false, nil
}

// Follow convention for internalS3 name in charts/workstealer/templates/s3 below.
// Checks if hostname ends with the same suffix to determine if internalS3.
func isInternalS3(endpoint string) bool {
	internalS3Suffix := "-lunchpail-minio"
	return strings.HasSuffix(strings.Split(endpoint, ".")[0], internalS3Suffix)
}
