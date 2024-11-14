package names

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"os"

	"lunchpail.io/pkg/ir/llir"
)

func QueueHash(ctx llir.Context) (string, error) {
	hash := sha256.New()
	if b, err := json.Marshal(ctx.Queue); err != nil {
		return "", err
	} else if _, err := hash.Write(b); err != nil {
		return "", err
	}

	fmt.Fprintln(os.Stderr, "!!!!!!!!!!!!!!!!!!!!", ctx.Run.Step, ctx.Queue, fmt.Sprintf("%x", hash.Sum(nil)))

	return fmt.Sprintf("%x", hash.Sum(nil)), nil
}

// This will be used to name the queue Secret and will be used as the
// envPrefix for secrets injected into the containers. Since dashes
// are not valid in bash variable names, so we avoid those here.
func Queue(ctx llir.Context) (string, error) {
	hash, err := QueueHash(ctx)
	if err != nil {
		return "", err
	}

	if len(hash) > 60 {
		hash = hash[:60]
	}
	return "lp-" + hash, nil
}
