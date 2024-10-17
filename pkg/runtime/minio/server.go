package minio

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"slices"
	"strings"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/fe/transformer/api"
	"lunchpail.io/pkg/runtime/queue"
	"lunchpail.io/pkg/util"
)

func Server(ctx context.Context, port int, args api.PathArgs) error {
	fmt.Fprintf(os.Stderr, "Lunchpail Minio component starting up\n")
	fmt.Fprintf(os.Stderr, "%v\n", os.Environ())

	accessKey := os.Getenv("lunchpail_queue_accessKeyID")
	if accessKey == "" {
		return fmt.Errorf("Missing env var lunchpail_queue_accessKeyID")
	}

	secretKey := os.Getenv("lunchpail_queue_secretAccessKey")
	if secretKey == "" {
		return fmt.Errorf("Missing env var lunchpail_queue_secretAccessKey")
	}

	group, _ := errgroup.WithContext(ctx)

	c, err := queue.NewS3ClientFromOptions(ctx, queue.S3ClientOptions{
		Endpoint:        fmt.Sprintf("localhost:%d", port),
		AccessKeyID:     accessKey,
		SecretAccessKey: secretKey,
	})
	if err != nil {
		return err
	}

	minio, err := exec.LookPath("minio")
	if err != nil {
		return err
	}

	datadir := "data"
	if err := os.MkdirAll(datadir, 0755); err != nil {
		return err
	}

	fmt.Fprintf(os.Stderr, "Launching Minio server with minio=%s bucket=%s run=%s\n", minio, args.Bucket, args.RunName)
	// NOT CommandContext, as group.Wait() below will otherwise kill the minio server
	cmd := exec.CommandContext(ctx, "minio", "server", datadir, "--address", fmt.Sprintf(":%d", port))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Env = slices.Concat(os.Environ(), []string{
		"MINIO_ROOT_USER=" + accessKey,
		"MINIO_ROOT_PASSWORD=" + secretKey,
	})
	if err := cmd.Start(); err != nil {
		return err
	}

	fmt.Fprintf(os.Stderr, "Ensuring bucket exists bucket=%s\n", args.Bucket)
	if err := c.Mkdirp(args.Bucket); err != nil {
		return err
	}
	fmt.Fprintf(os.Stderr, "Ensuring bucket exists bucket=%s <-- READY!\n", args.Bucket)

	// This watches for minio server death
	gotKillFile := false
	group.Go(func() error {
		fmt.Fprintf(os.Stderr, "Waiting for kill file\n")
		if err := waitForKillFile(c, args); err != nil {
			return err
		}
		fmt.Fprintf(os.Stderr, "Got kill file\n")
		gotKillFile = true

		fmt.Fprintf(os.Stderr, "About to self-destruct...\n")
		util.SleepBeforeExit()
		fmt.Fprintf(os.Stderr, "Initiating self-destruct\n")

		if err := cmd.Process.Kill(); err != nil {
			return err
		}
		return nil
	})

	if err := cmd.Wait(); err != nil {
		// Below, we intentionally kill the minio
		// server; make sure we don't report that as
		// an unintended error
		if !gotKillFile || !strings.Contains(err.Error(), "signal: killed") {
			return err
		}
	}

	fmt.Fprintf(os.Stderr, "Exiting\n")
	return nil
}

func waitForKillFile(c queue.S3Client, args api.PathArgs) error {
	return c.WaitTillExists(args.Bucket, args.TemplateP(api.AllDoneMarker))
}
