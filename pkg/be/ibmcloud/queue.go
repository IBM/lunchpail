package ibmcloud

import (
	"context"
	"fmt"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
)

// Queue properties for a given run, plus ensure access to the endpoint from this client
func (backend Backend) AccessQueue(ctx context.Context, run queue.RunContext, opts build.LogOptions) (endpoint, accessKeyID, secretAccessKey, bucket string, stop func(), err error) {
	err = fmt.Errorf("Unsupported operation: 'AccessQueue'")
	return
}
