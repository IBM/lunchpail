package ibmcloud

import (
	"fmt"
	"strings"
	"time"

	"github.com/IBM/go-sdk-core/v5/core"
	"github.com/IBM/vpc-go-sdk/vpcv1"
)

// TODO: Self-destruction
func stopOrDeleteVM(vpcService *vpcv1.VpcV1, name string, resourceGroupID string, delete bool) error {
	options := &vpcv1.ListInstancesOptions{
		ResourceGroupID: &resourceGroupID,
		//Limit:           core.Int64Ptr(int64(count)), //default: 50
		VPCName: &name,
	}
	instances, response, err := vpcService.ListInstances(options)
	if err != nil {
		return fmt.Errorf("Failed to get virtual instances: %v and the response is: %s", err, response)
	}

	for _, instance := range instances.Instances { //TODO: iterate through next pages when multiple
		_, response, err := vpcService.CreateInstanceAction(
			&vpcv1.CreateInstanceActionOptions{
				InstanceID: instance.ID,
				Type:       core.StringPtr("stop"),
			})
		if err != nil {
			return fmt.Errorf("Failed to stop the instance: %v and the response is: %s", err, response)
		}

		if delete {
			floatingIPs, response, err := vpcService.ListInstanceNetworkInterfaceFloatingIps(
				&vpcv1.ListInstanceNetworkInterfaceFloatingIpsOptions{
					InstanceID:         instance.ID,
					NetworkInterfaceID: instance.PrimaryNetworkInterface.ID,
				})
			if err != nil {
				return fmt.Errorf("Failed to get floating IPs: %v and the response is: %s", err, response)
			}
			for _, fp := range floatingIPs.FloatingIps {
				response, err := vpcService.RemoveInstanceNetworkInterfaceFloatingIP(
					&vpcv1.RemoveInstanceNetworkInterfaceFloatingIPOptions{
						ID:                 fp.ID,
						InstanceID:         instance.ID,
						NetworkInterfaceID: instance.PrimaryNetworkInterface.ID,
					})
				if err != nil {
					return fmt.Errorf("Failed to disassociate floating IP: %v and the response is: %s", err, response)
				}

				response, err = vpcService.DeleteFloatingIP(vpcService.NewDeleteFloatingIPOptions(*fp.ID))
				if err != nil {
					return fmt.Errorf("Failed to delete floating IP: %v and the response is: %s", err, response)
				}
			}

			response, err = vpcService.DeleteInstance(
				&vpcv1.DeleteInstanceOptions{
					ID: instance.ID,
				})
			if err != nil {
				return fmt.Errorf("Failed to delete the instance: %v and the response is: %s", err, response)
			}
		}
	}

	if delete {
		for {
			options := &vpcv1.ListInstancesOptions{
				ResourceGroupID: &resourceGroupID,
				//Limit:           core.Int64Ptr(int64(count)), //default: 50
				VPCName: &name,
			}
			instances, response, err := vpcService.ListInstances(options)
			if err != nil {
				return fmt.Errorf("Failed to get virtual instances: %v and the response is: %s", err, response)
			}
			if len(instances.Instances) == 0 {
				break
			}
			time.Sleep((10 * time.Second))
		}

		subnets, response, err := vpcService.ListSubnets(
			&vpcv1.ListSubnetsOptions{
				ResourceGroupID: &resourceGroupID,
				VPCName:         &name,
			})
		if err != nil {
			return fmt.Errorf("Failed to get subnet: %v and the response is: %s", err, response)
		}

		for _, s := range subnets.Subnets {
			response, err := vpcService.DeleteSubnet(
				&vpcv1.DeleteSubnetOptions{
					ID: s.ID,
				})
			if err != nil {
				return fmt.Errorf("Failed to delete the subnet: %v and the response is: %s", err, response)
			}
		}

		vpcs, response, err := vpcService.ListVpcs(
			&vpcv1.ListVpcsOptions{
				ResourceGroupID: &resourceGroupID,
			})
		if err != nil {
			return fmt.Errorf("Failed to get vpc: %v and the response is: %s", err, response)
		}

		for _, vpc := range vpcs.Vpcs {
			if strings.Compare(*vpc.Name, name) == 0 {
				response, err := vpcService.DeleteVPC(
					&vpcv1.DeleteVPCOptions{
						ID: vpc.ID,
					})
				if err != nil {
					return fmt.Errorf("Failed to delete the vpc: %v and the response is: %s", err, response)
				}
			}
		}

		securityGroups, response, err := vpcService.ListSecurityGroups(
			&vpcv1.ListSecurityGroupsOptions{
				ResourceGroupID: &resourceGroupID,
				VPCName:         &name,
			})
		if err != nil {
			return fmt.Errorf("Failed to get security group: %v and the response is: %s", err, response)
		}

		for _, sg := range securityGroups.SecurityGroups {
			response, err := vpcService.DeleteSecurityGroup(
				&vpcv1.DeleteSecurityGroupOptions{
					ID: sg.ID,
				})
			if err != nil {
				return fmt.Errorf("Failed to delete the security group: %v and the response is: %s", err, response)
			}
		}

		keys, response, err := vpcService.ListKeys(
			&vpcv1.ListKeysOptions{},
		)
		for _, k := range keys.Keys {
			if strings.Compare(*k.Name, name) == 0 {
				response, err := vpcService.DeleteKey(
					&vpcv1.DeleteKeyOptions{
						ID: k.ID,
					})
				if err != nil {
					return fmt.Errorf("Failed to delete the ssh key: %v and the response is: %s", err, response)
				}
			}
		}
	}
	return nil
}
