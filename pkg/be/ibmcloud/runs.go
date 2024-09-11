package ibmcloud

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/IBM/vpc-go-sdk/vpcv1"
	"lunchpail.io/pkg/be/runs"
	"lunchpail.io/pkg/compilation"
)

func (backend Backend) ListRuns() ([]runs.Run, error) {
	appName := compilation.Name()
	resourceGroupID := backend.config.ResourceGroup.GUID
	vpcRuns := []runs.Run{}

	vpcs, response, err := backend.vpcService.ListVpcs(&vpcv1.ListVpcsOptions{
		ResourceGroupID: &resourceGroupID,
		Headers:         map[string]string{"AppName": appName},
	})
	if err != nil {
		return vpcRuns, fmt.Errorf("failed to get vpcs: %v and the response is: %s", err, response)
	}

	for _, vpc := range vpcs.Vpcs {
		if strings.HasPrefix(*vpc.Name, appName) { //Contains instead of prefix?
			vpcRuns = append(vpcRuns, runs.Run{Name: *vpc.Name, CreationTimestamp: time.Time(*vpc.CreatedAt)})
		}
	}

	sort.Slice(vpcRuns, func(i, j int) bool { return vpcRuns[i].CreationTimestamp.Before(vpcRuns[j].CreationTimestamp) })
	return vpcRuns, nil
}
