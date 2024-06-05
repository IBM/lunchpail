package skypilot

import (
	"github.com/IBM/vpc-go-sdk/vpcv1"
	"lunchpail.io/pkg/be/platform"
)

type Backend struct {
	config     platform.IbmConfig
	vpcService *vpcv1.VpcV1
}
