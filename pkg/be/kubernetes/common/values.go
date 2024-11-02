package common

import (
	"fmt"

	"lunchpail.io/pkg/be/kubernetes/names"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/lunchpail"
)

func Values(ir llir.LLIR, opts Options) ([]string, error) {
	imagePullSecretName, dockerconfigjson, err := imagePullSecret(opts.ImagePullSecret)
	if err != nil {
		return []string{}, err
	}

	serviceAccount := ir.RunName()
	if !opts.NeedsServiceAccount && imagePullSecretName == "" {
		serviceAccount = ""
	}

	return []string{
		"lunchpail.name=" + ir.RunName(),
		"lunchpail.partOf=" + ir.AppName,
		"lunchpail.ips.name=" + imagePullSecretName,
		"lunchpail.ips.dockerconfigjson=" + dockerconfigjson,
		fmt.Sprintf("lunchpail.namespace.create=%v", opts.CreateNamespace),
		"lunchpail.rbac.serviceaccount=" + serviceAccount,
		fmt.Sprintf("lunchpail.taskqueue.auto=%v", ir.Queue().Auto),
		"lunchpail.taskqueue.dataset=" + names.Queue(ir.Context.Run),
		"lunchpail.taskqueue.endpoint=" + ir.Queue().Endpoint,
		"lunchpail.taskqueue.bucket=" + ir.Queue().Bucket,
		"lunchpail.taskqueue.accessKey=" + ir.Queue().AccessKey,
		"lunchpail.taskqueue.secretKey=" + ir.Queue().SecretKey,
		"lunchpail.image.registry=" + lunchpail.ImageRegistry,
		"lunchpail.image.repo=" + lunchpail.ImageRepo,
		"lunchpail.image.version=" + lunchpail.Version(),
		fmt.Sprintf("lunchpail.debug=%v", opts.Log.Debug),
	}, nil
}
