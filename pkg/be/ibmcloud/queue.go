package ibmcloud

import (
	"context"
	"fmt"

	"lunchpail.io/pkg/ir/queue"
)

// Queue properties for a given run, plus ensure access to the endpoint from this client
func (backend Backend) AccessQueue(ctx context.Context, run queue.RunContext) (endpoint, accessKeyID, secretAccessKey, bucket string, stop func(), err error) {
	err = fmt.Errorf("Unsupported operation: 'AccessQueue'")
	return
}

func (backend Backend) Queue(ctx context.Context, run queue.RunContext) (endpoint, accessKeyID, secretAccessKey, bucket string, err error) {
	err = fmt.Errorf("Unsupported operation: 'Queue'")
	return
}
