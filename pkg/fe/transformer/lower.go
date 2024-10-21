package transformer

import (
	"slices"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api/dispatch"
	"lunchpail.io/pkg/fe/transformer/api/minio"
	"lunchpail.io/pkg/fe/transformer/api/workerpool"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/ir/queue"
)

// HLIR -> LLIR
func Lower(buildName, runname string, model hlir.HLIR, queueSpec queue.Spec, opts build.Options) (llir.LLIR, error) {
	ir := llir.LLIR{AppName: buildName, RunName: runname, Queue: queueSpec}

	minio, err := minio.Lower(buildName, runname, model, ir, opts)
	if err != nil {
		return llir.LLIR{}, err
	}
	if minio != nil {
		ir.Components = slices.Concat([]llir.Component{minio})
	}

	apps, err := lowerApplications(buildName, runname, model, ir, opts)
	if err != nil {
		return llir.LLIR{}, err
	}

	dispatchers, err := dispatch.Lower(buildName, runname, model, ir, opts)
	if err != nil {
		return llir.LLIR{}, err
	}

	pools, err := workerpool.LowerAll(buildName, runname, model, ir, opts)
	if err != nil {
		return llir.LLIR{}, err
	}

	appProvidedKubernetes, err := lowerAppProvidedKubernetesResources(buildName, runname, model)
	if err != nil {
		return llir.LLIR{}, err
	}
	ir.AppProvidedKubernetesResources = appProvidedKubernetes

	ir.Components = slices.Concat(ir.Components, apps, dispatchers, pools)

	return ir, nil
}
