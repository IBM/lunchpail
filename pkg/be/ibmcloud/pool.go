package ibmcloud

import "fmt"

func (backend Backend) ChangeWorkers(poolName, poolNamespace, poolContext string, delta int) error {
	return fmt.Errorf("Unsupported operation: ChangeWorkers")
}
