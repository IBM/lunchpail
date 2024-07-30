package ibmcloud

import (
	"encoding/json"
	"os"
	"path/filepath"

	"lunchpail.io/pkg/assembly"
)

type resourceGroup struct {
	GUID string `json:"GUID"`
	Name string `json:"Name"`
}

type ibmConfig struct {
	IAMToken      string        `json:"IAMToken"`
	ResourceGroup resourceGroup `json:"ResourceGroup"`
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
