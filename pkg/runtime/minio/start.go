package minio

import (
	"fmt"
	"os"
)

func printenv() {
	for _, e := range os.Environ() {
		fmt.Fprintf(os.Stderr, "%v\n", e)
	}
}

func Start() error {
	fmt.Printf("INFO Minio Server starting")
	printenv()

	if err := launchMinioServer(); err != nil {
		return err
	}

	return nil
}
