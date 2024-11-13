package runtime

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"

	"lunchpail.io/pkg/be/local/shell"
	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/ir/llir"
)

func RunLocally(ctx context.Context, component string, lowerir string, opts build.LogOptions) error {
	var c llir.ShellComponent
	var ir llir.LLIR
	var componentByte []byte
	var lowerirByte []byte
	var err error

	if componentByte, err = base64.StdEncoding.DecodeString(component); err != nil {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "%v\n", err)
		}
		return err
	}
	if err := json.Unmarshal(componentByte, &c); err != nil {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "%v\n", err)
		}
		return err
	}

	if lowerirByte, err = base64.StdEncoding.DecodeString(lowerir); err != nil {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "%v\n", err)
		}
		return err
	}
	if err := json.Unmarshal(lowerirByte, &ir); err != nil {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "%v\n", err)
		}
		return err
	}

	return shell.Spawn(ctx, c, ir, opts)
}
