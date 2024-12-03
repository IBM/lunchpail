package ibmcloud

import (
	"encoding/json"
	"fmt"
	"math/rand/v2"
	"os"
	"path/filepath"
	"strings"

	"github.com/IBM/vpc-go-sdk/vpcv1"
	"golang.org/x/crypto/ssh"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/compilation"
)

type resourceGroup struct {
	GUID string `json:"GUID"`
	Name string `json:"Name"`
}

type ibmConfig struct {
	IAMToken      string        `json:"IAMToken"`
	ResourceGroup resourceGroup `json:"ResourceGroup"`
	Region        string        `json:"Region"`
	// IAMRefreshToken string `json:"IAMRefreshToken"`
}

// Retrieve bearer token and other login info from ibmcloud's standard config file
func loadConfig() (ibmConfig, error) {
	var config ibmConfig

	homedir, err := os.UserHomeDir()
	if err != nil {
		return config, err
	}

	bytes, err := os.ReadFile(filepath.Join(homedir, ".bluemix", "config.json"))
	if err != nil {
		return config, err
	}

	if err := json.Unmarshal(bytes, &config); err != nil {
		return config, err
	}

	return config, nil
}

// Replace the config file values with user specificed values from command line
func loadConfigWithCommandLineOverrides(aopts build.Options) ibmConfig {
	// intentionally ignoring error, as we have fallbacks if we couldn't find or load the config
	config, _ := loadConfig()

	if aopts.ResourceGroupID != "" {
		config.ResourceGroup.GUID = aopts.ResourceGroupID
	}

	return config
}

// Use region from ibmcloud's standard config file to get a randomized zone within that region
func getRandomizedZone(config ibmConfig, vpcService *vpcv1.VpcV1) (string, error) {
	if config.Region != "" {
		zones, response, err := vpcService.ListRegionZones(&vpcv1.ListRegionZonesOptions{
			RegionName: &config.Region,
		})
		if err != nil {
			return "", fmt.Errorf("failed to get zones from region: %v and the response is: %s", err, response)
		}

		return *zones.Zones[rand.IntN(len(zones.Zones))].Name, err
	}
	return "", nil
}

// Retrieve public key from user's ssh dir, if exists
// Looks for two ssh key types: “rsa” and “ed25519" (ibmcloud supported)
func loadPublicKey(config ibmConfig, aopts compilation.Options) (string, []string, error) {
	homedir, err := os.UserHomeDir()
	if err != nil {
		return "", []string{}, err
	}

	var bytes []byte
	if len(aopts.PublicSSHKey) != 0 {
		return aopts.SSHKeyType, aopts.PublicSSHKey, nil
	} else if bytes, err = os.ReadFile(filepath.Join(homedir, ".ssh", "id_rsa.pub")); err == nil && bytes != nil {
		pKeyComps := strings.Split(string(bytes), " ")
		if len(pKeyComps) >= 2 && strings.Trim(pKeyComps[0], " ") == ssh.KeyAlgoRSA {
			return "rsa", []string{string(bytes)}, nil
		}
	} else if bytes, err = os.ReadFile(filepath.Join(homedir, ".ssh", "id_ed25519.pub")); err == nil && bytes != nil {
		pKeyComps := strings.Split(string(bytes), " ")
		if len(pKeyComps) >= 2 && strings.Trim(pKeyComps[0], " ") == ssh.KeyAlgoED25519 {
			return "ed25519", []string{string(bytes)}, nil
		}
	}

	return "", []string{}, nil
}
