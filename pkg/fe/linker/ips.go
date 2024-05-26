package linker

import (
	b64 "encoding/base64"
	"fmt"
	"regexp"
)

func imagePullSecret(imagePullSecret string) (string, string, error) {
	imagePullSecretName := ""
	dockerconfigjson := ""
	if imagePullSecret != "" {
		ipsPattern := regexp.MustCompile("^([^:]+):([^@]+)@(.+)$")

		if match := ipsPattern.FindStringSubmatch(imagePullSecret); len(match) != 4 {
			return "", "", fmt.Errorf("image pull secret option must be of the form <user>:<token>@ghcr.io: %s", imagePullSecret)
		} else {
			registryUser := match[1]
			registryToken := match[2]
			imageRegistry := match[3]
			userColonToken := fmt.Sprintf("%s:%s", registryUser, registryToken)
			registryAuth := b64.StdEncoding.EncodeToString([]byte(userColonToken))
			imagePullSecretName = "lunchpail-image-pull-secret"
			dockerconfigjson = b64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(`
{       
    "auths":
    {
        "%s":
            {
                "auth":"%s"
            }
    }
}
`, imageRegistry, registryAuth)))
		}
	}

	return imagePullSecretName, dockerconfigjson, nil
}
