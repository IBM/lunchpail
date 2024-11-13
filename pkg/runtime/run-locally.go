package runtime

import (
	"bytes"
	"compress/gzip"
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

	var err error

	componentByte, err := base64.StdEncoding.DecodeString(component)
	if err != nil {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "%v\n", err)
		}
		return err
	}
	reader, err := gzip.NewReader(bytes.NewReader(componentByte))
	if err != nil {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "%v\n", err)
		}
		return err
	}
	defer reader.Close()

	if err := json.NewDecoder(reader).Decode(&c); err != nil {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "%v\n", err)
		}
		return err
	}

	irByte, err := base64.StdEncoding.DecodeString(lowerir)
	if err != nil {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "%v\n", err)
		}
		return err
	}
	reader, err = gzip.NewReader(bytes.NewReader(irByte))
	if err != nil {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "%v\n", err)
		}
		return err
	}
	defer reader.Close()

	if err := json.NewDecoder(reader).Decode(&ir); err != nil {
		if opts.Verbose {
			fmt.Fprintf(os.Stderr, "%v\n", err)
		}
		return err
	}

	return shell.Spawn(ctx, c, ir, opts)
}
