package queue

import (
	"context"
	"testing"
	"time"
)

// Verify that the transient-error retry loop is actually bounded: a
// client pointed at a dead endpoint must give up (with "connection
// refused" counted as transient) rather than retry forever. We start
// the counter near the cap so the test is fast, but with a value
// receiver in retryOnError the counter would never accumulate and
// this test would spin until the go test timeout.
func TestRetryBound(t *testing.T) {
	c, err := NewS3ClientFromOptions(context.Background(), S3ClientOptions{
		Endpoint:        "localhost:1", // nothing listens here
		AccessKeyID:     "lunchpail",
		SecretAccessKey: "lunchpail",
	})
	if err != nil {
		t.Fatal(err)
	}
	c.retries = maxRetries - 2 // let it retry twice, then the bound must fire

	start := time.Now()
	_, err = c.BucketExists("somebucket")
	elapsed := time.Since(start)

	if err == nil {
		t.Fatal("expected an error from a dead endpoint")
	}
	if elapsed > 10*time.Second {
		t.Fatalf("retry loop took too long to give up: %v (bound not working?)", elapsed)
	}
	if elapsed < 2*time.Second {
		t.Fatalf("gave up too quickly: %v (2 x 1s retries expected)", elapsed)
	}
}
