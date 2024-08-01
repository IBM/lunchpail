package ibmcloud

import (
	"lunchpail.io/pkg/assembly"
)

func New(aopts assembly.Options) (Backend, error) {
	config := loadConfigWithCommandLineOverrides(aopts)
	keytype, key, err := loadPublicKey(config, aopts)

	vpcService, err := Authenticator(aopts.ApiKey, config)
	if err != nil {
		return Backend{}, err
	}

	return Backend{config, vpcService, keytype, key}, nil
}
