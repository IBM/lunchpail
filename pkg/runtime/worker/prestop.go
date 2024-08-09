package worker

import (
	"fmt"
	"os"
	"strings"
)

func PreStop() error {
	client, err := newS3Client()
	if err != nil {
		return err
	}

	paths := pathsForRun()

	fmt.Println("DEBUG Marker worker as done...")

	client.rm(paths.bucket, paths.alive)
	client.touch(paths.bucket, paths.dead)

	fmt.Printf("INFO This worker is shutting down %s\n", strings.Replace(os.Getenv("LUNCHPAIL_POD_NAME"), os.Getenv("LUNCHPAIL_RUN_NAME")+"-", "", 1))

	return nil
}
