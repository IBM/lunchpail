package worker

import (
	"fmt"
	"os"
	"strings"

	"lunchpail.io/pkg/runtime/queue"
)

func PreStop() error {
	client, err := queue.NewS3Client()
	if err != nil {
		return err
	}

	fmt.Println("DEBUG Marker worker as done...")

	client.Rm(client.Paths.Bucket, client.Paths.Alive)
	client.Touch(client.Paths.Bucket, client.Paths.Dead)

	fmt.Printf("INFO This worker is shutting down %s\n", strings.Replace(os.Getenv("LUNCHPAIL_POD_NAME"), os.Getenv("LUNCHPAIL_RUN_NAME")+"-", "", 1))

	return nil
}
