package linker

import (
	"lunchpail.io/pkg/fe/linker/helm"
	"lunchpail.io/pkg/fe/linker/yaml/queue"
	"lunchpail.io/pkg/ir/hlir"
)

type nfs struct {
	Path   string `json:"path"`
	Server string `json:"server"`
}

type pvc struct {
	ClaimName string `json:"claimName"`
}

type volume struct {
	Name                  string `json:"name"`
	Nfs                   *nfs `json:"nfs,omitempty"`
	PersistentVolumeClaim *pvc `json:"persistentVolumeClaim,omitempty"`
}

type volumeMount struct {
	Name      string `json:"name"`
	MountPath string `json:"mountPath,omitempty"`
}

type secretRef struct {
	Name string `json:"name"`
}

type envFrom struct {
	SecretRef secretRef `json:"secretRef"`
	Prefix    string `json:"prefix,omitempty"`
}

func envForQueue(queueSpec queue.Spec) envFrom {
	return envFrom{secretRef{queueSpec.Name}, queueSpec.Name + "_"}
}

func datasets(app hlir.Application, queueSpec queue.Spec) ([]volume, []volumeMount, []envFrom, error) {
	volumes := []volume{}
	volumeMounts := []volumeMount{}
	envFroms := []envFrom{envForQueue(queueSpec)}

	for _, dataset := range app.Spec.Datasets {
		name := dataset.Name

		if dataset.Nfs.Server != "" {
			v := volume{}
			v.Name = name
			v.Nfs = &nfs{dataset.Nfs.Server, dataset.Nfs.Path}
			volumes = append(volumes, v)
			volumeMounts = append(volumeMounts, volumeMount{name, dataset.MountPath})
		}
		if dataset.Pvc.ClaimName != "" {
			v := volume{}
			v.Name = name
			v.PersistentVolumeClaim = &pvc{dataset.Pvc.ClaimName}
			volumes = append(volumes, v)
			volumeMounts = append(volumeMounts, volumeMount{name, dataset.MountPath})
		}
		if dataset.S3.Secret != "" {
			envFroms = append(envFroms, envFrom{secretRef{dataset.S3.Secret}, dataset.S3.EnvPrefix})
		}
	}

	return volumes, volumeMounts, envFroms, nil
}

func datasetsB64(app hlir.Application, queueSpec queue.Spec) (string, string, string, error) {
	volumes, volumeMounts, envFroms, err := datasets(app, queueSpec)
	if err != nil {
		return "", "", "", err
	}

	volumesB64, err := helm.ToJsonB64(volumes)
	if err != nil {
		return "", "", "", err
	}

	volumeMountsB64, err := helm.ToJsonB64(volumeMounts)
	if err != nil {
		return "", "", "", err
	}

	envFromsB64, err := helm.ToJsonB64(envFroms)
	if err != nil {
		return "", "", "", err
	}

	return volumesB64, volumeMountsB64, envFromsB64, nil
}
