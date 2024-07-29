package ibmcloud

import (
	"errors"
	"fmt"

	"github.com/IBM/go-sdk-core/v5/core"
	"github.com/IBM/vpc-go-sdk/vpcv1"
)

func Authenticator(apiKey string) (*vpcv1.VpcV1, error) {
	// Instantiate the service with an API key based IAM authenticator
	vpcService, err := vpcv1.NewVpcV1(&vpcv1.VpcV1Options{
		Authenticator: &core.IamAuthenticator{
			ApiKey: apiKey,
		},
	})
	if err != nil {
		return nil, errors.New("Error creating VPC Service with apikey" + apiKey)
	}
	fmt.Println("Instantiated the VPC service using API key.")
	return vpcService, nil
}
