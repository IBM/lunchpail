//go:build full || manage

package ibmcloud

import (
	"errors"
	"fmt"

	"github.com/IBM/go-sdk-core/v5/core"
	"github.com/IBM/vpc-go-sdk/vpcv1"
)

func Authenticator(apiKey string, config ibmConfig) (*vpcv1.VpcV1, error) {
	var auth core.Authenticator
	var method = "apikey"
	if apiKey == "" && config.IAMToken != "" {
		bearerAuth, err := core.NewBearerTokenAuthenticator(config.IAMToken)
		if err != nil {
			return nil, err
		}
		method = "bearer token"
		auth = bearerAuth
	} else if apiKey != "" {
		auth = &core.IamAuthenticator{
			ApiKey: apiKey,
		}

	} else {
		return nil, fmt.Errorf("Either use 'ibmcloud login' or rerun with an '--api-key' option")
	}

	// Instantiate the service with an API key based IAM authenticator
	vpcService, err := vpcv1.NewVpcV1(&vpcv1.VpcV1Options{
		Authenticator: auth,
	})
	if err != nil {
		return nil, errors.New("Error creating VPC Service with apikey" + apiKey)
	}
	fmt.Printf("Accessing the VPC service via %s\n", method)

	return vpcService, nil
}
