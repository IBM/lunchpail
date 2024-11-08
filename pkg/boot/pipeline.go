package boot

import (
	"encoding/json"
	"io"
	"os"

	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/util"
)

func handlePipelineStdin() (llir.Context, error) {
	var context llir.Context

	if !util.StdinIsTty() {
		// Then we are not the first step. Load the context
		// from stdin.
		var stdinContext llir.Context
		dec := json.NewDecoder(os.Stdin)
		for {
			err := dec.Decode(&stdinContext)
			if err == io.EOF {
				break
			} else if err != nil {
				return context, err
			} else {
				break
			}
		}

		if stdinContext.Queue.Endpoint != "" {
			context = stdinContext
		}
	}

	context.Run = context.Run.AsFinalStep(util.StdoutIsTty())
	return context, nil
}

func handlePipelineStdout(context llir.Context) error {
	if !util.StdoutIsTty() {
		// The next step is +1 our step
		context.Run = context.Run.IncrStep()

		// The next steps should not create ("Auto") their own queue endpoint
		context.Queue = context.Queue.NoAuto()

		b, err := json.Marshal(context)
		if err != nil {
			return err
		}
		if _, err := os.Stdout.Write(b); err != nil {
			return err
		}
	}

	return nil

}
