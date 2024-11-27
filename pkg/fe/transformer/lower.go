package transformer

import (
	"slices"

	"lunchpail.io/pkg/build"
	"lunchpail.io/pkg/fe/transformer/api/minio"
	"lunchpail.io/pkg/fe/transformer/api/workerpool"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
)

// HLIR -> LLIR
func Lower(buildName string, model hlir.HLIR, ctx llir.Context, opts build.Options) (llir.LLIR, error) {
	ir := llir.LLIR{AppName: buildName, Context: ctx}

	if minio, minioOk, err := minio.Lower(buildName, ctx, model, opts); err != nil {
		return llir.LLIR{}, err
	} else if minioOk {
		ir.Components = slices.Concat([]llir.ShellComponent{minio})
	}

	apps, err := lowerApplications(buildName, ctx, model, opts)
	if err != nil {
		return llir.LLIR{}, err
	}

	pools, err := workerpool.LowerAll(buildName, ctx, model, opts)
	if err != nil {
		return llir.LLIR{}, err
	}

	appProvidedKubernetes, err := lowerAppProvidedKubernetesResources(buildName, ctx.Run.RunName, model)
	if err != nil {
		return llir.LLIR{}, err
	}
	ir.AppProvidedKubernetesResources = appProvidedKubernetes

	ir.Components = slices.Concat(ir.Components, apps, pools)

	return ir, nil
}
