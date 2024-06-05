package skypilot

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path"

	"github.com/IBM/go-sdk-core/v5/core"
	"github.com/IBM/vpc-go-sdk/vpcv1"
	"lunchpail.io/pkg/be/platform"
)

func Authenticator(apiKey string, config platform.IbmConfig) (*vpcv1.VpcV1, error) {
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

	//To access IBM’s VPC service, store the apikey and resource group in $HOME/.ibm/credentials.yaml
	credsPath := os.Getenv("HOME") + "/.ibm/credentials.yaml"
	err = os.MkdirAll(path.Dir(credsPath), 0755)
	if err != nil {
		return nil, err
	}
	f, err := os.Create(credsPath)
	if err != nil {
		return nil, err
	}

	defer f.Close()
	d := []string{"iam_api_key: " + apiKey, "resource_group_id: " + config.ResourceGroup.GUID}

	for _, v := range d {
		_, err = fmt.Fprintln(f, v)
		if err != nil {
			return nil, err
		}
	}

	cmd := exec.Command("/bin/bash", "-c", "env DOCKER_HOST=unix:///var/run/docker.sock docker run -td --rm --name sky -v ${HOME}/.sky:/root/.sky:rw -v $HOME/.ibm:/root/.ibm:rw berkeleyskypilot/skypilot")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("internal Error starting docker container: %v", err)
	}
	return vpcService, nil
}
