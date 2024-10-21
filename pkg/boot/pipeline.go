package boot

import (
	"encoding/json"
	"io"
	"os"

	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/util"
)

func handlePipelineStdin() (llir.Context, error) {
	if !util.StdinIsTty() {
		var context llir.Context
		dec := json.NewDecoder(os.Stdin)
		for {
			err := dec.Decode(&context)
			if err == io.EOF {
				break
			} else if err != nil {
				return context, err
			}
		}

		if context.Queue.Endpoint != "" {
			// context.Run.RunName = fmt.Sprintf("%s-%d", context.Run.RunName, context.Run.Step)
			return context, nil
		}
	}

	// Otherwise, we are step 0
	return llir.Context{}, nil
}

func handlePipelineStdout(context llir.Context) error {
	if !util.StdoutIsTty() {
		r := context.Run
		r.Step++
		context.Run = r

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
