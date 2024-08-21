package transformer

import (
	"slices"

	"lunchpail.io/pkg/compilation"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/fe/transformer/api/dispatch"
	"lunchpail.io/pkg/fe/transformer/api/minio"
	"lunchpail.io/pkg/fe/transformer/api/workerpool"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

// HLIR -> LLIR
func Lower(compilationName, runname, namespace string, model hlir.AppModel, queueSpec queue.Spec, yamlValues string, opts compilation.Options, verbose bool) (llir.LLIR, error) {
	ir := llir.LLIR{AppName: compilationName, RunName: runname, Namespace: namespace, Queue: queueSpec, Values: llir.Values{Yaml: yamlValues}}

	minio, err := minio.Lower(compilationName, runname, namespace, model, ir, opts, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}

	apps, err := lowerApplications(compilationName, runname, namespace, model, ir, opts, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}

	dispatchers, err := dispatch.Lower(compilationName, runname, namespace, model, ir, opts, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}

	pools, err := workerpool.LowerAll(compilationName, runname, namespace, model, ir, opts, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}

	globals, err := lowerGlobals(compilationName, runname, model)
	if err != nil {
		return llir.LLIR{}, err
	}

	ir.K8sCommonResources = globals
	ir.Components = slices.Concat([]llir.Component{minio}, apps, dispatchers, pools)

	return ir, nil
}
