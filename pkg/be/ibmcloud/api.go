//go:build full || manage || observe

package ibmcloud

import "github.com/IBM/vpc-go-sdk/vpcv1"

type Backend struct {
	config       ibmConfig
	vpcService   *vpcv1.VpcV1
	sshKeyType   string
	sshPublicKey string
}
