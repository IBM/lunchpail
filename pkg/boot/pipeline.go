package boot

import (
	"encoding/json"
	"fmt"
	"io"
	"os"

	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/util"
)

type PipelineMeta struct {
	Step    int        `json:"step"`
	RunName string     `json:"runName"`
	Queue   queue.Spec `json:"queue"`
}

func handlePipelineStdin(ir llir.LLIR) (PipelineMeta, error) {
	if !util.StdinIsTty() {
		var meta PipelineMeta
		dec := json.NewDecoder(os.Stdin)
		for {
			err := dec.Decode(&meta)
			if err == io.EOF {
				break
			} else if err != nil {
				return meta, err
			}
		}

		if meta.Queue.Endpoint != "" {
			meta.RunName = fmt.Sprintf("%s-%d", meta.RunName, meta.Step)
			return meta, nil
		}
	}

	return PipelineMeta{RunName: ir.RunName, Step: 0, Queue: ir.Queue}, nil
}

func handlePipelineStdout(meta PipelineMeta) error {
	if !util.StdoutIsTty() {
		meta.Step++
		b, err := json.Marshal(meta)
		if err != nil {
			return err
		}
		if _, err := os.Stdout.Write(b); err != nil {
			return err
		}
	}

	return nil
}
