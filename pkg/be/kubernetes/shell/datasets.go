package shell

import (
	"fmt"
	"strings"

	"lunchpail.io/pkg/be/kubernetes/names"
	q "lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/ir/llir"
	"lunchpail.io/pkg/ir/queue"
	"lunchpail.io/pkg/util"
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
	Nfs                   *nfs   `json:"nfs,omitempty"`
	PersistentVolumeClaim *pvc   `json:"persistentVolumeClaim,omitempty"`
}

type volumeMount struct {
	Name      string `json:"name"`
	MountPath string `json:"mountPath,omitempty"`
}

type initContainer struct {
	Name         string        `json:"name"`
	Image        string        `json:"image"`
	Command      []string      `json:"command"`
	EnvFrom      []envFrom     `json:"envFrom"`
	VolumeMounts []volumeMount `json:"volumeMounts"`
}

type secretRef struct {
	Name string `json:"name"`
}

type envFrom struct {
	// The secret that stores the environment variables we wish to
	// bind to a worker
	SecretRef secretRef `json:"secretRef"`

	// Prefix string for environment variables bound to the values
	// in the referenced secret
	Prefix string `json:"prefix,omitempty"`
}

func datasets(app hlir.Application, context llir.Context) ([]volume, []volumeMount, []envFrom, []initContainer, []map[string]string, error) {
	volumes := []volume{}
	volumeMounts := []volumeMount{}
	envFroms := []envFrom{envForQueue(context)}
	secrets := []map[string]string{}
	initContainers := []initContainer{}

	for didx, dataset := range app.Spec.Datasets {
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
		if dataset.S3.Rclone.RemoteName != "" {
			isValid, remoteSpec, err := q.SpecFromRcloneRemoteName(dataset.S3.Rclone.RemoteName, "", context.Run.RunName, context.Queue.Port)

			if err != nil {
				return nil, nil, nil, nil, secrets, err
			} else if !isValid {
				return nil, nil, nil, nil, secrets, fmt.Errorf("Error: invalid or missing rclone config for given remote=%s for Application=%s", dataset.S3.Rclone.RemoteName, app.Metadata.Name)
			} else if dataset.S3.EnvFrom.Prefix != "" {
				secretName := fmt.Sprintf("%s-%d", context.Run.RunName, didx)
				secrets = append(secrets, map[string]string{
					"endpoint":        updateTestQueueEndpoint(remoteSpec.Endpoint, context.Queue),
					"accessKeyID":     remoteSpec.AccessKey,
					"secretAccessKey": remoteSpec.SecretKey,
				})
				envFroms = append(envFroms, envFrom{secretRef{secretName}, dataset.S3.EnvFrom.Prefix})
			}
		}
	}

	return volumes, volumeMounts, envFroms, initContainers, secrets, nil
}

func datasetsB64(app hlir.Application, context llir.Context) (string, string, string, string, []string, error) {
	secretsB64 := []string{}

	volumes, volumeMounts, envFroms, initContainers, secrets, err := datasets(app, context)
	if err != nil {
		return "", "", "", "", secretsB64, err
	}

	volumesB64, err := util.ToJsonB64(volumes)
	if err != nil {
		return "", "", "", "", secretsB64, err
	}

	volumeMountsB64, err := util.ToJsonB64(volumeMounts)
	if err != nil {
		return "", "", "", "", secretsB64, err
	}

	envFromsB64, err := util.ToJsonB64(envFroms)
	if err != nil {
		return "", "", "", "", secretsB64, err
	}

	initContainersB64, err := util.ToJsonB64(initContainers)
	if err != nil {
		return "", "", "", "", secretsB64, err
	}

	for _, secret := range secrets {
		str, err := util.ToJsonB64(secret)
		if err != nil {
			return "", "", "", "", secretsB64, err
		}
		secretsB64 = append(secretsB64, str)
	}

	return volumesB64, volumeMountsB64, envFromsB64, initContainersB64, secretsB64, nil
}

// Inject queue secrets
func envForQueue(context llir.Context) envFrom {
	return envFrom{
		Prefix:    "lunchpail_queue_",
		SecretRef: secretRef{names.Queue(context.Run)},
	}
}

func updateTestQueueEndpoint(s string, queue queue.Spec) string {
	return strings.Replace(s, "$TEST_QUEUE_ENDPOINT", queue.Endpoint, -1)
}
