package ibmcloud

import (
	"fmt"
	"os/exec"
	"strconv"

	"github.com/IBM/go-sdk-core/v4/core"
	"github.com/IBM/vpc-go-sdk/vpcv1"
	"k8s.io/utils/pointer"
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/be"
	"lunchpail.io/pkg/ir/llir"

	"github.com/elotl/cloud-init/config"
)

type Action string

const (
	Create Action = "create"
	Stop          = "stop"
	Delete        = "delete"
)

func createInstance(vpcService *vpcv1.VpcV1, name string, ir llir.LLIR, resourceGroupID string, vpcID string, keyID string, zone string, profile string, subnetID string, secGroupID string, imageID string) (*vpcv1.Instance, error) {
	networkInterfacePrototypeModel := &vpcv1.NetworkInterfacePrototype{
		Name: &name,
		Subnet: &vpcv1.SubnetIdentityByID{
			ID: &subnetID,
		},
		SecurityGroups: []vpcv1.SecurityGroupIdentityIntf{&vpcv1.SecurityGroupIdentityByID{
			ID: &secGroupID,
		}},
	}

	appYamlString, err := ir.Marshal()
	if err != nil {
		return nil, fmt.Errorf("Failed to marshall yaml: %v", err)
	}

	cc := &config.CloudConfig{
		WriteFiles: []config.File{
			{
				Path:               "/app.yaml",
				Content:            appYamlString,
				Owner:              "root:root",
				RawFilePermissions: "0644",
			}},
		RunCmd: []string{"kind create cluster", "mkdir -p ~/.kube", "kind get kubeconfig > ~/.kube/config", "kubectl cluster-info --context kind-kind", "kubectl apply -f /app.yaml"},
	}

	instancePrototypeModel := &vpcv1.InstancePrototypeInstanceByImage{
		Name: &name,
		ResourceGroup: &vpcv1.ResourceGroupIdentity{
			ID: &resourceGroupID,
		},
		Profile: &vpcv1.InstanceProfileIdentityByName{
			Name: &profile,
		},
		VPC: &vpcv1.VPCIdentityByID{
			ID: &vpcID,
		},
		Keys: []vpcv1.KeyIdentityIntf{&vpcv1.KeyIdentityByID{
			ID: &keyID,
		}},
		PrimaryNetworkInterface: networkInterfacePrototypeModel,
		Zone: &vpcv1.ZoneIdentityByName{
			Name: &zone,
		},
		Image: &vpcv1.ImageIdentityByID{
			ID: &imageID,
		},
		UserData: core.StringPtr(cc.String()),
	}

	instance, response, err := vpcService.CreateInstance(
		vpcService.NewCreateInstanceOptions(
			instancePrototypeModel,
		))
	if err != nil {
		return nil, fmt.Errorf("Failed to create a virtual instance: %v and the response is: %s", err, response)
	}
	fmt.Printf("Created a VSI instance with ID:%s.", *instance.ID)
	return instance, nil
}

func createFloatingIP(vpcService *vpcv1.VpcV1, name string, resourceGroupID string, zone string) (string, error) {
	floatingIPModel := &vpcv1.FloatingIPPrototype{
		ResourceGroup: &vpcv1.ResourceGroupIdentity{
			ID: &resourceGroupID,
		},
		Zone: &vpcv1.ZoneIdentity{
			Name: &zone,
		},
		Name: &name,
	}

	floatingIP, response, err := vpcService.CreateFloatingIP(vpcService.NewCreateFloatingIPOptions(
		floatingIPModel,
	))
	if err != nil {
		return "", fmt.Errorf("Failed to create a floatingIP: %v and the response is: %s", err, response)
	}
	return *floatingIP.ID, nil
}

func createSecurityGroup(vpcService *vpcv1.VpcV1, name string, resourceGroupID string, vpcID string) (string, error) {
	options := &vpcv1.CreateSecurityGroupOptions{
		Name: &name,
		VPC: &vpcv1.VPCIdentity{
			ID: &vpcID,
		},
		ResourceGroup: &vpcv1.ResourceGroupIdentity{
			ID: &resourceGroupID,
		},
	}
	securityGroup, response, err := vpcService.CreateSecurityGroup(options)
	if err != nil {
		return "", fmt.Errorf("Failed to create a security group: %v and the response is: %s", err, response)
	}
	return *securityGroup.ID, nil
}

func createSecurityGroupRule(vpcService *vpcv1.VpcV1, secGroupID string) error {
	addresscmd := exec.Command("curl", "-s", "ifconfig.me")
	address, err := addresscmd.Output()
	if err != nil {
		return fmt.Errorf("Internal Error getting IP address: %v", err)
	}

	options := &vpcv1.CreateSecurityGroupRuleOptions{
		SecurityGroupID: &secGroupID,
		SecurityGroupRulePrototype: &vpcv1.SecurityGroupRulePrototype{
			Direction: core.StringPtr("inbound"),
			Protocol:  core.StringPtr("tcp"),
			IPVersion: core.StringPtr("ipv4"),
			PortMin:   core.Int64Ptr(22),
			PortMax:   core.Int64Ptr(22),
			Remote: &vpcv1.SecurityGroupRuleRemotePrototype{
				Address: core.StringPtr(string(address)),
			},
		},
	}

	_, response, err := vpcService.CreateSecurityGroupRule(options)
	if err != nil {
		return fmt.Errorf("Failed to create an inbound security group rule: %v and the response is: %s", err, response)
	}

	options = &vpcv1.CreateSecurityGroupRuleOptions{
		SecurityGroupID: &secGroupID,
		SecurityGroupRulePrototype: &vpcv1.SecurityGroupRulePrototype{
			Direction: core.StringPtr("outbound"),
			Protocol:  core.StringPtr("all"),
		},
	}

	_, response, err = vpcService.CreateSecurityGroupRule(options)
	if err != nil {
		return fmt.Errorf("Failed to create an outboundc security group rule: %v and the response is: %s", err, response)
	}
	return nil
}

func createSubnet(vpcService *vpcv1.VpcV1, name string, resourceGroupID string, vpcID string, zone string) (string, error) {
	options := &vpcv1.CreateSubnetOptions{
		SubnetPrototype: &vpcv1.SubnetPrototype{
			Name: &name,
			VPC: &vpcv1.VPCIdentity{
				ID: &vpcID,
			},
			Zone: &vpcv1.ZoneIdentity{
				Name: &zone,
			},
			ResourceGroup: &vpcv1.ResourceGroupIdentity{
				ID: &resourceGroupID,
			},
			TotalIpv4AddressCount: core.Int64Ptr(1024),
			IPVersion:             core.StringPtr("ipv4"),
		},
	}
	subnet, response, err := vpcService.CreateSubnet(options)
	if err != nil {
		return "", fmt.Errorf("Failed to create a subnet: %v and the response is: %s", err, response)
	}
	return *subnet.ID, nil
}

func createSSHKey(vpcService *vpcv1.VpcV1, name string, resourceGroupID string, keyType string, pubKey string) (string, error) {
	options := &vpcv1.CreateKeyOptions{
		Name:      &name,
		PublicKey: &pubKey,
		ResourceGroup: &vpcv1.ResourceGroupIdentity{
			ID: &resourceGroupID,
		},
		Type: core.StringPtr(keyType),
	}
	key, response, err := vpcService.CreateKey(options)
	if err != nil {
		return "", fmt.Errorf("Failed to create an ssh key: %v and the response is: %s", err, response)
	}
	return *key.ID, nil
}

func createVPC(vpcService *vpcv1.VpcV1, name string, resourceGroupID string) (string, error) {
	options := &vpcv1.CreateVPCOptions{
		Name: &name,
		ResourceGroup: &vpcv1.ResourceGroupIdentity{
			ID: &resourceGroupID,
		},
	}
	vpc, response, err := vpcService.CreateVPC(options)
	if err != nil {
		return "", fmt.Errorf("Failed to create a VPC: %v and the response is: %s", err, response)
	}
	return *vpc.ID, nil
}

func createAndInitVM(vpcService *vpcv1.VpcV1, name string, ir llir.LLIR, resourceGroupID string, count int, keyType string, publicKey string, zone string, profile string, imageID string) error {
	vpcID, err := createVPC(vpcService, name, resourceGroupID)
	if err != nil {
		return err
	}

	keyID, err := createSSHKey(vpcService, name, resourceGroupID, keyType, publicKey)
	if err != nil {
		return err
	}

	subnetID, err := createSubnet(vpcService, name, resourceGroupID, vpcID, zone)
	if err != nil {
		return err
	}

	secGroupID, err := createSecurityGroup(vpcService, name, resourceGroupID, vpcID)
	if err != nil {
		return err
	}

	if err = createSecurityGroupRule(vpcService, secGroupID); err != nil {
		return err
	}

	for i := 1; i <= count; i++ {
		instance, err := createInstance(vpcService, name+"-"+strconv.Itoa(i), ir, resourceGroupID, vpcID, keyID, zone, profile, subnetID, secGroupID, imageID)
		if err != nil {
			return err
		}

		floatingIPID, err := createFloatingIP(vpcService, name+"-"+strconv.Itoa(i), resourceGroupID, zone)
		if err != nil {
			return err
		}

		options := &vpcv1.AddInstanceNetworkInterfaceFloatingIPOptions{
			ID:                 &floatingIPID,
			InstanceID:         instance.ID,
			NetworkInterfaceID: instance.PrimaryNetworkInterface.ID,
		}
		_, response, err := vpcService.AddInstanceNetworkInterfaceFloatingIP(options)
		if err != nil {
			return fmt.Errorf("Failed to add floating IP to network interface: %v and the response is: %s", err, response)
		}

	}
	return nil
}

func SetAction(aopts assembly.Options, ir llir.LLIR, runname string, action Action) error {
	vpcService, err := Authenticator(aopts.ApiKey)
	if err != nil {
		return err
	}

	if action == Stop || action == Delete {
		if err := stopOrDeleteVM(vpcService, runname, aopts.ResourceGroupID, action == Delete); err != nil {
			return err
		}
	} else if action == Create {
		var workerCount int32
		for _, c := range ir.Components {
			for _, j := range c.Jobs {
				workerCount = *j.Spec.Parallelism
			}
		}
		//Compute number of VSIs to be provisioned and job parallelism for each VSI
		parallelism, numInstances, err := be.ComputeParallelismAndInstanceCount(vpcService, aopts.Profile, workerCount)
		if err != nil {
			return fmt.Errorf("Failed to compute number of instances and job parallelism: %v", err)
		}

		for _, c := range ir.Components {
			for _, j := range c.Jobs {
				j.Spec.Parallelism = pointer.Int32Ptr(int32(parallelism)) //TODO modifying Job spec field
			}
		}

		if err := createAndInitVM(vpcService, runname, ir, aopts.ResourceGroupID, numInstances, aopts.SSHKeyType, aopts.PublicSSHKey, aopts.Zone, aopts.Profile, aopts.ImageID); err != nil {
			return err
		}
	}
	return nil
}
