package ibmcloud

import (
	"context"
	"fmt"
	"os"

	"lunchpail.io/pkg/build"
	q "lunchpail.io/pkg/client/queue"
	"lunchpail.io/pkg/ir/queue"
)

// Queue properties for a given run, plus ensure access to the endpoint from this client
func (backend Backend) AccessQueue(ctx context.Context, run queue.RunContext, rclone string, opts build.LogOptions) (endpoint, accessKeyID, secretAccessKey, bucket string, stop func(), err error) {
	endpoint, accessKeyID, secretAccessKey, bucket, err = backend.queue(rclone)
	if opts.Verbose {
		fmt.Fprintf(os.Stderr, "Accessing Queue with endpoint %s and bucket %s\n", endpoint, bucket)
	}
	stop = func() {}
	return
}

func (backend Backend) queue(rclone string) (endpoint, accessKeyID, secretAccessKey, bucket string, err error) {
	var spec queue.Spec
	if rclone != "" {
		spec, err = q.AccessQueue(rclone)
		if err != nil {
			return
		}
	}
	endpoint = spec.Endpoint
	accessKeyID = spec.AccessKey
	secretAccessKey = spec.SecretKey
	bucket = spec.Bucket
	return
}
