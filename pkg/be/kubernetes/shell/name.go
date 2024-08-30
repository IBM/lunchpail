package shell

import (
	"lunchpail.io/pkg/lunchpail"
	"lunchpail.io/pkg/util"
)

func ResourceName(instanceName string, component lunchpail.Component) string {
	return util.Dns1035(instanceName + "-" + string(component))
}
