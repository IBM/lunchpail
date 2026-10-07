package minio

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"slices"
	"strings"

	"golang.org/x/sync/errgroup"

	"lunchpail.io/pkg/ir/queue"
	s3 "lunchpail.io/pkg/runtime/queue"
	"lunchpail.io/pkg/util"
)

func Server(ctx context.Context, port int, run queue.RunContext) error {
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

	c, err := s3.NewS3ClientFromOptions(ctx, s3.S3ClientOptions{
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

	fmt.Fprintf(os.Stderr, "Launching Minio server with minio=%s bucket=%s run=%s\n", minio, run.Bucket, run.RunName)
	cmd := exec.CommandContext(ctx, minio, "server", datadir, "--address", fmt.Sprintf(":%d", port))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Env = slices.Concat(os.Environ(), []string{
		"MINIO_ROOT_USER=" + accessKey,
		"MINIO_ROOT_PASSWORD=" + secretKey,
	})
	if err := cmd.Start(); err != nil {
		return err
	}

	// Reap the minio server process exactly once, and make its exit
	// observable, so that a server that dies before the queue is
	// ready surfaces as an immediate, explanatory error rather than
	// as s3 clients blindly retrying a dead endpoint.
	childExit := make(chan error, 1)
	go func() { childExit <- cmd.Wait() }()

	fmt.Fprintf(os.Stderr, "Ensuring bucket exists bucket=%s\n", run.Bucket)
	// Note: we must watch for the minio server's exit while waiting
	// for the bucket, as Mkdirp will otherwise retry a dead endpoint
	// for as long as the s3 client's retry budget allows.
	mkdirpDone := make(chan error, 1)
	go func() { mkdirpDone <- c.Mkdirp(run.Bucket) }()
	select {
	case err := <-mkdirpDone:
		if err != nil {
			return err
		}
	case werr := <-childExit:
		// the minio server died before the queue was ready
		if werr != nil {
			return fmt.Errorf("Minio server exited during startup: %w", werr)
		}
		return fmt.Errorf("Minio server exited during startup")
	}
	fmt.Fprintf(os.Stderr, "Ensuring bucket exists bucket=%s <-- READY!\n", run.Bucket)

	// This watches for minio server death
	gotKillFile := false
	group.Go(func() error {
		fmt.Fprintf(os.Stderr, "Waiting for kill file\n")
		if err := waitForKillFile(c, run); err != nil {
			return err
		}
		fmt.Fprintf(os.Stderr, "Minio got kill file. About to self-destruct...\n")
		gotKillFile = true

		util.SleepBeforeExit()
		fmt.Fprintf(os.Stderr, "Minio initiating self-destruct\n")

		if err := cmd.Process.Kill(); err != nil {
			return err
		}
		return nil
	})

	if err := <-childExit; err != nil {
		// Below, we intentionally kill the minio
		// server; make sure we don't report that as
		// an unintended error
		if !gotKillFile || !strings.Contains(err.Error(), "signal: killed") {
			return err
		}
	}

	fmt.Fprintf(os.Stderr, "Minio Exiting\n")
	return nil
}

func waitForKillFile(c s3.S3Client, run queue.RunContext) error {
	return c.WaitTillExists(run.Bucket, run.AsFile(queue.AllDoneMarker))
}
