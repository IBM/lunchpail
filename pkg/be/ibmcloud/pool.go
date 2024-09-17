package ibmcloud

import (
	"context"
	"fmt"
)

func (backend Backend) ChangeWorkers(ctx context.Context, poolName, poolNamespace, poolContext string, delta int) error {
	return fmt.Errorf("Unsupported operation: ChangeWorkers")
}
