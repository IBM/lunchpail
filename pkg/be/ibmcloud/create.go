package ibmcloud

import (
	"context"
	"errors"
	"fmt"
	"math"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/IBM/go-sdk-core/v5/core"
	"github.com/IBM/vpc-go-sdk/vpcv1"
	"github.com/elotl/cloud-init/config"
	"golang.org/x/crypto/ssh"
	"golang.org/x/sync/errgroup"
	q "lunchpail.io/pkg/ir/queue"

	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/util"
)

type Action string

const (
	Create Action = "create"
	Stop          = "stop"
	Delete        = "delete"
)

// IP address lengths (string).
const (
	IPv4Maxlen = 15
	IPv6Maxlen = 39
)

type intCounter struct {
	lock    sync.Mutex
	counter int
}

func (i *intCounter) inc() {
	i.lock.Lock()
	time.Sleep(10 * time.Millisecond)
	i.counter++
	i.lock.Unlock()
}

func createInstance(vpcService *vpcv1.VpcV1, name string, resourceGroupID string, vpcID string, keyID string, zone string, profile string, subnetID string, secGroupID string, imageID string, namespace string, copts llir.Options, cc *config.CloudConfig) (*vpcv1.Instance, error) {
	networkInterfacePrototypeModel := &vpcv1.NetworkInterfacePrototype{
		Name: &name,
		Subnet: &vpcv1.SubnetIdentityByID{
			ID: &subnetID,
		},
		SecurityGroups: []vpcv1.SecurityGroupIdentityIntf{&vpcv1.SecurityGroupIdentityByID{
			ID: &secGroupID,
		}},
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
	ipversion := "ipv4"
	if len(address) > IPv4Maxlen && len(address) <= IPv6Maxlen && strings.Contains(string(address), ":") {
		ipversion = "ipv6"
	}
	options := &vpcv1.CreateSecurityGroupRuleOptions{
		SecurityGroupID: &secGroupID,
		SecurityGroupRulePrototype: &vpcv1.SecurityGroupRulePrototype{
			Direction: core.StringPtr("inbound"),
			Protocol:  core.StringPtr("tcp"),
			IPVersion: core.StringPtr(ipversion),
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
		if response.StatusCode == http.StatusBadRequest && err.Error() == "Key with fingerprint already exists" {
			//get fingerprint of input public key
			sshPubKey, _, _, _, _ := ssh.ParseAuthorizedKey([]byte(pubKey))
			keyFingerprint := ssh.FingerprintSHA256(sshPubKey)

			keys, response, err := vpcService.ListKeys(&vpcv1.ListKeysOptions{
				Limit: core.Int64Ptr(100), //TODO: max limit on a page is 100, but need to list more pages
			})
			if err != nil {
				return "", fmt.Errorf("failed to list ssh keys: %v and the response is: %s", err, response)
			}
			for _, ekey := range keys.Keys {
				if *ekey.Type == keyType && *ekey.Fingerprint == keyFingerprint { //found existing one
					return *ekey.ID, nil
				}
			}
		}
		return "", fmt.Errorf("failed to create an ssh key: %v and the response is: %s", err, response)
	}
	return *key.ID, nil
}

func createVPC(vpcService *vpcv1.VpcV1, name string, appName string, resourceGroupID string) (string, error) {
	options := &vpcv1.CreateVPCOptions{
		Name: &name,
		ResourceGroup: &vpcv1.ResourceGroupIdentity{
			ID: &resourceGroupID,
		},
		Headers: map[string]string{"AppName": appName},
	}
	vpc, response, err := vpcService.CreateVPC(options)
	if err != nil {
		return "", fmt.Errorf("failed to create a VPC: %v and the response is: %s", err, response)
	}
	return *vpc.ID, nil
}

func createImage(vpcService *vpcv1.VpcV1, name string, resourceGroupID string, vmID string) (string, error) {
	options := &vpcv1.CreateImageOptions{
		ImagePrototype: &vpcv1.ImagePrototype{
			Name: &name,
			ResourceGroup: &vpcv1.ResourceGroupIdentity{
				ID: &resourceGroupID,
			},
			SourceVolume: &vpcv1.VolumeIdentityByID{
				ID: &vmID,
			},
		},
	}
	image, response, err := vpcService.CreateImage(options)
	if err != nil {
		return "", fmt.Errorf("failed to create an Image: %v and the response is: %s", err, response)
	}
	return *image.ID, nil
}

func createResources(ctx context.Context, vpcService *vpcv1.VpcV1, name string, ir llir.LLIR, resourceGroupID string, keyType string, publicKey string, zone string, profile string, imageID string, namespace string, opts llir.Options) (string, error) {
	var instanceID string
	t1s := time.Now()
	vpcID, err := createVPC(vpcService, name, ir.AppName, resourceGroupID)
	if err != nil {
		return "", err
	}
	t1e := time.Now()

	t2s := t1e
	keyID, err := createSSHKey(vpcService, name, resourceGroupID, keyType, publicKey)
	if err != nil {
		return "", err
	}
	t2e := time.Now()

	t3s := t2e
	subnetID, err := createSubnet(vpcService, name, resourceGroupID, vpcID, zone)
	if err != nil {
		return "", err
	}
	t3e := time.Now()

	t4s := t3e
	secGroupID, err := createSecurityGroup(vpcService, name, resourceGroupID, vpcID)
	if err != nil {
		return "", err
	}
	t4e := time.Now()

	t5s := t4e
	if err = createSecurityGroupRule(vpcService, secGroupID); err != nil {
		return "", err
	}
	t5e := time.Now()

	t6s := time.Now()
	if err = createVMForComponents(ctx, vpcService, name, ir, resourceGroupID, zone, profile, imageID, namespace, vpcID, keyID, subnetID, secGroupID, opts); err != nil {
		return "", err
	}
	t6e := time.Now()

	if opts.Log.Verbose {
		fmt.Fprintf(os.Stderr, "Setup done %s\n", util.RelTime(t1s, t6e))
		fmt.Fprintf(os.Stderr, "  - VPC %s\n", util.RelTime(t1s, t1e))
		fmt.Fprintf(os.Stderr, "  - SSH %s\n", util.RelTime(t2s, t2e))
		fmt.Fprintf(os.Stderr, "  - Subnet %s\n", util.RelTime(t3s, t3e))
		fmt.Fprintf(os.Stderr, "  - SecurityGroup %s\n", util.RelTime(t4s, t4e))
		fmt.Fprintf(os.Stderr, "  - SecurityGroupRule %s\n", util.RelTime(t5s, t5e))
		fmt.Fprintf(os.Stderr, "  - VMs %s\n", util.RelTime(t6s, t6e))
	}
	return instanceID, nil
}

func createVMForComponents(ctx context.Context, vpcService *vpcv1.VpcV1, name string, ir llir.LLIR, resourceGroupID string, zone string, profile string, imageID string, namespace string, vpcID string, keyID string, subnetID string, secGroupID string, opts llir.Options) error {
	group, _ := errgroup.WithContext(ctx)
	var verboseFlag string

	for _, c := range ir.Components {
		instanceName := name + "-" + string(c.C())
		if opts.Log.Verbose {
			fmt.Fprintf(os.Stderr, "Creating VM %s\n", instanceName)
		}

		componentB64, err := util.ToJsonB64(c)
		if err != nil {
			fmt.Fprintf(os.Stderr, "%v\n", err)
			return err
		}

		llirB64, err := util.ToJsonB64(ir)
		if err != nil {
			fmt.Fprintf(os.Stderr, "%v\n", err)
			return err
		}

		if opts.Log.Verbose {
			verboseFlag = "--verbose"
		}

		cc := &config.CloudConfig{
			RunCmd: []string{"curl https://dl.min.io/client/mc/release/linux-amd64/mc --create-dirs -o /minio-binaries/mc",
				"chmod +x /minio-binaries/mc",
				"export PATH=$PATH:/minio-binaries/",
				"mc alias set myminio " + ir.Context.Queue.Endpoint + " " + ir.Context.Queue.AccessKey + " " + ir.Context.Queue.SecretKey, // setting mc config
				"apt-get install jq -y",
				"exec=$(mc stat myminio/" + ir.Context.Queue.Bucket + "/" + ir.Context.Run.AsFile(q.Blobs) + "/ --json | jq -r '.name')",
				"mc get myminio/" + ir.Context.Queue.Bucket + "/" + ir.Context.Run.AsFile(q.Blobs) + "/$exec /lunchpail", //use mc client to download binary
				"chmod +x /lunchpail",
				"env HOME=/root /lunchpail component run-locally --component " + string(componentB64) + " --llir " + string(llirB64) + " " + verboseFlag},
		}

		//TODO: Compute number of VSIs to be provisioned and job parallelism for each VSI based on number of workers and workerpools
		group.Go(func() error {
			instance, err := createInstance(vpcService, instanceName, resourceGroupID, vpcID, keyID, zone, profile, subnetID, secGroupID, imageID, namespace, opts, cc)
			if err != nil {
				return err
			}

			floatingIPID, err := createFloatingIP(vpcService, instanceName, resourceGroupID, zone)
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
			return nil
		})
	}
	if err := group.Wait(); err != nil {
		return err
	}
	return nil
}
func (backend Backend) SetAction(ctx context.Context, opts llir.Options, ir llir.LLIR, action Action) error {
	runname := ir.RunName()

	if action == Stop || action == Delete {
		if err := stopOrDeleteVM(backend.vpcService, runname, backend.config.ResourceGroup.GUID, action == Delete); err != nil {
			return err
		}
	} else if action == Create {
		zone := opts.Zone //command line zone value
		if zone == "" {   //random zone value using config
			randomZone, err := getRandomizedZone(backend.config, backend.vpcService) //Todo: spread among random zones with a subnet in each zone
			if err != nil {
				return err
			}
			zone = randomZone
		}
		if _, err := createResources(ctx, backend.vpcService, runname, ir, backend.config.ResourceGroup.GUID, backend.sshKeyType, backend.sshPublicKey, zone, opts.Profile, opts.ImageID, backend.namespace, opts); err != nil {
			return err
		}
	}
	return nil
}

func computeParallelismAndInstanceCount(vpcService *vpcv1.VpcV1, profile string, workers int32) (parallelism []int64, instanceCount int, err error) {
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
		numCpu := *vcpuCount.Value

		instanceCount = int(float64(workers) / float64(numCpu))
		remainder := int(math.Mod(float64(workers), float64(numCpu)))

		if workers < int32(numCpu) {
			parallelism = []int64{int64(workers)}
		} else {
			for range instanceCount {
				parallelism = append(parallelism, numCpu)
			}
			if remainder > 0 {
				parallelism = append(parallelism, int64(remainder))
				instanceCount++
			}
		}
	}

	return parallelism, instanceCount, nil
}
