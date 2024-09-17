package ibmcloud

import (
	"context"
	"fmt"
)

// Queue properties for a given run, plus ensure access to the endpoint from this client
func (backend Backend) AccessQueue(ctx context.Context, runname string) (endpoint, accessKeyID, secretAccessKey, bucket, prefixPath string, stop func(), err error) {
	err = fmt.Errorf("Unsupported operation: 'AccessQueue'")
	return
}

func (backend Backend) Queue(ctx context.Context, runname string) (endpoint, accessKeyID, secretAccessKey, bucket, prefixPath string, err error) {
	err = fmt.Errorf("Unsupported operation: 'Queue'")
	return
}
