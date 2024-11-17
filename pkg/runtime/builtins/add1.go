package builtins

import (
	"lunchpail.io/pkg/ir/hlir"
)

func Add1App() hlir.HLIR {
	app := hlir.NewWorkerApplication("add1")
	app.Spec.Command = "./main.sh"
	app.Spec.Image = "docker.io/alpine:3"
	app.Spec.Code = []hlir.Code{
		hlir.Code{Name: "main.sh", Source: `#!/bin/sh
printf '%d' $((1+$(cat $1))) > $2`},
	}

	return hlir.HLIR{
		Applications: []hlir.Application{app},
		WorkerPools:  []hlir.WorkerPool{hlir.NewPool("add1", 1)},
	}
}
