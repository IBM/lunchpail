package skypilot

import (
	"lunchpail.io/pkg/be/platform"
	"lunchpail.io/pkg/compilation"
)

func New(aopts compilation.Options) (Backend, error) {
	config := platform.LoadConfigWithCommandLineOverrides(aopts)

	vpcService, err := Authenticator(aopts.ApiKey, config)
	if err != nil {
		return Backend{}, err
	}

	return Backend{config, vpcService}, nil
}
