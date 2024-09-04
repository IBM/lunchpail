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
func Lower(compilationName, runname string, model hlir.AppModel, queueSpec queue.Spec, opts compilation.Options, verbose bool) (llir.LLIR, error) {
	ir := llir.LLIR{AppName: compilationName, RunName: runname, Queue: queueSpec}

	minio, err := minio.Lower(compilationName, runname, model, ir, opts, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}
	if minio != nil {
		ir.Components = slices.Concat([]llir.Component{minio})
	}

	apps, err := lowerApplications(compilationName, runname, model, ir, opts, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}

	dispatchers, err := dispatch.Lower(compilationName, runname, model, ir, opts, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}

	pools, err := workerpool.LowerAll(compilationName, runname, model, ir, opts, verbose)
	if err != nil {
		return llir.LLIR{}, err
	}

	appProvidedKubernetes, err := lowerAppProvidedKubernetesResources(compilationName, runname, model)
	if err != nil {
		return llir.LLIR{}, err
	}
	ir.AppProvidedKubernetesResources = appProvidedKubernetes

	ir.Components = slices.Concat(ir.Components, apps, dispatchers, pools)

	return ir, nil
}
