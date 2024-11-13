package ibmcloud

import (
	"context"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/queue"
)

// Queue properties for a given run, plus ensure access to the endpoint from this client
func (backend Backend) AccessQueue(ctx context.Context, run queue.RunContext, queue queue.Spec, opts build.LogOptions) (endpoint, accessKeyID, secretAccessKey, bucket string, stop func(), err error) {
	endpoint = queue.Endpoint
	accessKeyID = queue.AccessKey
	secretAccessKey = queue.SecretKey
	bucket = queue.Bucket
	stop = func() {}
	return
}
