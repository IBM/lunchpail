package shell

import (
	"fmt"
	"lunchpail.io/pkg/fe/linker/queue"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/util"
	"path/filepath"
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

func datasets(app hlir.Application, runname string, queueSpec queue.Spec) ([]volume, []volumeMount, []envFrom, []initContainer, []map[string]string, error) {
	volumes := []volume{}
	volumeMounts := []volumeMount{}
	envFroms := []envFrom{envForQueue(queueSpec)}
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
			isValid, spec, err := queue.SpecFromRcloneRemoteName(dataset.S3.Rclone.RemoteName, "", runname, queueSpec.Port)

			if err != nil {
				return nil, nil, nil, nil, secrets, err
			} else if !isValid {
				return nil, nil, nil, nil, secrets, fmt.Errorf("Error: invalid or missing rclone config for given remote=%s for Application=%s", dataset.S3.Rclone.RemoteName, app.Metadata.Name)
			} else if dataset.S3.EnvFrom.Prefix != "" {
				secretName := fmt.Sprintf("%s-%d", runname, didx)
				secrets = append(secrets, map[string]string{
					"endpoint":        spec.Endpoint,
					"accessKeyID":     spec.AccessKey,
					"secretAccessKey": spec.SecretKey,
				})
				envFroms = append(envFroms, envFrom{secretRef{secretName}, dataset.S3.EnvFrom.Prefix})
			} else if dataset.S3.CopyIn.Path != "" {
				// otherwise, we were asked to copy
				// data in from s3, so we will use the
				// secrets attached to an
				// initContainer
				initContainers = append(initContainers, initContainer{
					Name:  "s3-copy-in-" + dataset.Name,
					Image: "docker.io/rclone/rclone:1",
					// EnvFrom:      []envFrom{env},
					VolumeMounts: []volumeMount{volumeMount{"workdir", "/workdir"}},
					Command: []string{
						"/bin/sh",
						"-c",
						fmt.Sprintf(`
printenv

config=/tmp/rclone.conf
cat <<EOF > $config
[s3]
type = s3
provider = Other
env_auth = false
endpoint = %s
access_key_id = %s
secret_access_key = %s
acl = public-read
EOF

rclone --config $config config dump

# Delay the copy-in, if requested
sleep %d

rclone --retries 50 --config $config copyto -v s3:/%s /workdir/%s/%s
`, spec.Endpoint, spec.AccessKey, spec.SecretKey, dataset.S3.CopyIn.Delay, dataset.S3.CopyIn.Path, dataset.Name, filepath.Base(dataset.S3.CopyIn.Path)),
					},
				})
			}
		}
	}

	return volumes, volumeMounts, envFroms, initContainers, secrets, nil
}

func datasetsB64(app hlir.Application, runname string, queueSpec queue.Spec) (string, string, string, string, []string, error) {
	secretsB64 := []string{}

	volumes, volumeMounts, envFroms, initContainers, secrets, err := datasets(app, runname, queueSpec)
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
func envForQueue(queueSpec queue.Spec) envFrom {
	return envFrom{
		Prefix:    "lunchpail_queue_",
		SecretRef: secretRef{queueSpec.Name},
	}
}
