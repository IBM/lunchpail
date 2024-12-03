package ibmcloud

import "github.com/IBM/vpc-go-sdk/vpcv1"

type Backend struct {
	namespace    string
	config       ibmConfig
	vpcService   *vpcv1.VpcV1
	sshKeyType   string
	sshPublicKey []string
}
