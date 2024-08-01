package ibmcloud

import (
	"errors"
	"fmt"
	"math"
	"os/exec"
	"strconv"
	"time"

	"github.com/IBM/go-sdk-core/v5/core"
	"github.com/IBM/vpc-go-sdk/vpcv1"
	"lunchpail.io/pkg/assembly"
	"lunchpail.io/pkg/ir/llir"
	comp "lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/util"

	"github.com/elotl/cloud-init/config"
)

type Action string

const (
	Create Action = "create"
	Stop          = "stop"
	Delete        = "delete"
)

func createInstance(vpcService *vpcv1.VpcV1, name string, ir llir.LLIR, c llir.Component, resourceGroupID string, vpcID string, keyID string, zone string, profile string, subnetID string, secGroupID string, imageID string) (*vpcv1.Instance, error) {
	networkInterfacePrototypeModel := &vpcv1.NetworkInterfacePrototype{
		Name: &name,
		Subnet: &vpcv1.SubnetIdentityByID{
			ID: &subnetID,
		},
		SecurityGroups: []vpcv1.SecurityGroupIdentityIntf{&vpcv1.SecurityGroupIdentityByID{
			ID: &secGroupID,
		}},
	}

	appYamlString, err := ir.MarshalComponentArray(c)
	if err != nil {
		return nil, fmt.Errorf("failed to marshall yaml: %v", err)
	}
	cc := &config.CloudConfig{
		WriteFiles: []config.File{
			{
				Path:               "/app.yaml",
				Content:            appYamlString,
				Owner:              "root:root",
				RawFilePermissions: "0644",
			}},
		RunCmd: []string{"sleep 10", //Minimum of 10 seconds needed for cluster to be able to run `apply`
			"while ! kind get clusters | grep lunchpail; do sleep 2; done",
			"echo 'Kind cluster is ready'",
			"env HOME=/root kubectl apply -f /app.yaml"},
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
		return nil, fmt.Errorf("failed to create a virtual instance: %v and the response is: %s", err, response)
	}
	fmt.Printf("Created a VSI instance with ID: %s\n", *instance.ID)
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
		return "", fmt.Errorf("failed to create a floatingIP: %v and the response is: %s", err, response)
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
		return "", fmt.Errorf("failed to create a security group: %v and the response is: %s", err, response)
	}
	return *securityGroup.ID, nil
}

func createSecurityGroupRule(vpcService *vpcv1.VpcV1, secGroupID string) error {
	addresscmd := exec.Command("curl", "-s", "ifconfig.me")
	address, err := addresscmd.Output()
	if err != nil {
		return fmt.Errorf("internal error getting IP address: %v", err)
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
		return fmt.Errorf("failed to create an inbound security group rule: %v and the response is: %s", err, response)
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
		return fmt.Errorf("failed to create an outboundc security group rule: %v and the response is: %s", err, response)
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
		return "", fmt.Errorf("failed to create a subnet: %v and the response is: %s", err, response)
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
		return "", fmt.Errorf("failed to create an ssh key: %v and the response is: %s", err, response)
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
		return "", fmt.Errorf("failed to create a VPC: %v and the response is: %s", err, response)
	}
	return *vpc.ID, nil
}

func createAndInitVM(vpcService *vpcv1.VpcV1, name string, ir llir.LLIR, resourceGroupID string, keyType string, publicKey string, zone string, profile string, imageID string) error {
	t1s := time.Now()
	vpcID, err := createVPC(vpcService, name, resourceGroupID)
	if err != nil {
		return err
	}
	t1e := time.Now()

	t2s := t1e
	keyID, err := createSSHKey(vpcService, name, resourceGroupID, keyType, publicKey)
	if err != nil {
		return err
	}
	t2e := time.Now()

	t3s := t2e
	subnetID, err := createSubnet(vpcService, name, resourceGroupID, vpcID, zone)
	if err != nil {
		return err
	}
	t3e := time.Now()

	t4s := t3e
	secGroupID, err := createSecurityGroup(vpcService, name, resourceGroupID, vpcID)
	if err != nil {
		return err
	}
	t4e := time.Now()

	t5s := t4e
	if err = createSecurityGroupRule(vpcService, secGroupID); err != nil {
		return err
	}
	t5e := time.Now()

	t6s := t5e
	// One Component for WorkStealer, one for Dispatcher, and each per WorkerPool
	for _, c := range ir.Components {
		suff := "-" + string(c.Name)
		if c.Name == comp.DispatcherComponent || c.Name == comp.WorkStealerComponent {
			instance, err := createInstance(vpcService, name+suff, ir, c, resourceGroupID, vpcID, keyID, zone, profile, subnetID, secGroupID, imageID)
			if err != nil {
				return err
			}

			//TODO VSI instances other than jumpbox or main pod should not have floatingIP. Remove below after testing
			floatingIPID, err := createFloatingIP(vpcService, name+suff, resourceGroupID, zone)
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
				return fmt.Errorf("failed to add floating IP to network interface: %v and the response is: %s", err, response)
			}
		} else if c.Name == comp.WorkersComponent {
			workerCount := int32(0)
			for _, j := range c.Jobs {
				workerCount = workerCount + *j.Spec.Parallelism
			}

			//Compute number of VSIs to be provisioned and job parallelism for each VSI
			parallelism, numInstances, err := computeParallelismAndInstanceCount(vpcService, profile, workerCount)
			if err != nil {
				return fmt.Errorf("failed to compute number of instances and job parallelism: %v", err)
			}
			for _, j := range c.Jobs {
				*j.Spec.Parallelism = int32(parallelism)
			}

			for i := 1; i <= numInstances; i++ {
				if numInstances > 1 {
					suff = "-" + strconv.Itoa(i)
				}
				instance, err := createInstance(vpcService, name+suff, ir, c, resourceGroupID, vpcID, keyID, zone, profile, subnetID, secGroupID, imageID)
				if err != nil {
					return err
				}

				floatingIPID, err := createFloatingIP(vpcService, name+suff, resourceGroupID, zone)
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
					return fmt.Errorf("failed to add floating IP to network interface: %v and the response is: %s", err, response)
				}
			}
		}
	}
	t6e := time.Now()

	fmt.Printf("Setup done %s\n", util.RelTime(t1s, t6e))
	fmt.Printf("  - VPC %s\n", util.RelTime(t1s, t1e))
	fmt.Printf("  - SSH %s\n", util.RelTime(t2s, t2e))
	fmt.Printf("  - Subnet %s\n", util.RelTime(t3s, t3e))
	fmt.Printf("  - SecurityGroup %s\n", util.RelTime(t4s, t4e))
	fmt.Printf("  - SecurityGroupRule %s\n", util.RelTime(t5s, t5e))
	fmt.Printf("  - VMs %s\n", util.RelTime(t6s, t6e))
	return nil
}

func SetAction(aopts assembly.Options, ir llir.LLIR, runname string, action Action) error {
	config := loadConfigWithCommandLineOverrides(aopts)

	vpcService, err := Authenticator(aopts.ApiKey, config)
	if err != nil {
		return err
	}

	if action == Stop || action == Delete {
		if err := stopOrDeleteVM(vpcService, runname, config.ResourceGroup.GUID, action == Delete); err != nil {
			return err
		}
	} else if action == Create {
		if err := createAndInitVM(vpcService, runname, ir, config.ResourceGroup.GUID, aopts.SSHKeyType, aopts.PublicSSHKey, aopts.Zone, aopts.Profile, aopts.ImageID); err != nil {
			return err
		}
	}
	return nil
}

func computeParallelismAndInstanceCount(vpcService *vpcv1.VpcV1, profile string, workers int32) (parallelism int64, instanceCount int, err error) {
	//TODO: 1. Mapping table from size specified by application and user to IBM's profile table
	//2. Build comparison table for multiple cloud providers
	prof, response, err := vpcService.GetInstanceProfile(
		&vpcv1.GetInstanceProfileOptions{
			Name: &profile,
		})
	if err != nil {
		return parallelism, instanceCount, fmt.Errorf("failed to retrieve instance profile: %v and the response is: %s", err, response)
	}

	if prof != nil {
		vcpuCount, ok := prof.VcpuCount.(*vpcv1.InstanceProfileVcpu)
		if !ok {
			return parallelism, instanceCount, errors.New("failed to get VcpuCount from instance profile")
		}

		parallelism = *vcpuCount.Value
		if workers < int32(parallelism) {
			parallelism = int64(workers)
		}
		instanceCount = max(1, int(math.Ceil(float64(workers)/float64(parallelism))))
	}

	return parallelism, instanceCount, nil
}
