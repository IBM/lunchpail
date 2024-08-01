package ibmcloud

import (
	"encoding/json"
	"fmt"
	"math/rand/v2"
	"os"
	"path/filepath"

	"github.com/IBM/vpc-go-sdk/vpcv1"
	"lunchpail.io/pkg/assembly"
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

func loadConfigWithCommandLineOverrides(aopts assembly.Options) ibmConfig {
	// intentionally ignoring error, as we have fallbacks if we couldn't find or load the config
	config, _ := loadConfig()

	if aopts.ResourceGroupID != "" {
		config.ResourceGroup.GUID = aopts.ResourceGroupID
	}

	return config
}

func getRandomizedZone(config ibmConfig, vpcService *vpcv1.VpcV1) (string, error) {
	zones, response, err := vpcService.ListRegionZones(&vpcv1.ListRegionZonesOptions{
		RegionName: &config.Region,
	})
	if err != nil {
		return "", fmt.Errorf("failed to get zones from region: %v and the response is: %s", err, response)
	}

	return *zones.Zones[rand.IntN(len(zones.Zones))].Name, err
}
