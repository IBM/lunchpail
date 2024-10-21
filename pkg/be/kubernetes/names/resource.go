package names

import (
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/util"
)

func Resource(instanceName string, component lunchpail.Component) string {
	return util.Dns1035(instanceName + "-" + string(component))
}
