package linker

import (
	"errors"
	"fmt"
	"gopkg.in/yaml.v3"
	"io"
	"os"
	"strings"
)

type Metadata struct {
	Name string
}

type Api string

const (
	ShellApi     Api = "shell"
	WorkqueueApi Api = "workqueue"
)

type Env map[string]string

type Role string

const (
	WorkerRole     Role = "worker"
	DispatcherRole      = "dispatcher"
)

type Code struct {
	Name   string
	Source string
}

type SecurityContext struct {
	RunAsUser  int `yaml:"runAsUser,omitempty"`
	RunAsGroup int `yaml:"runAsGroup,omitempty"`
	FsGroup    int `yaml:"fsGroup,omitempty"`
}

type ContainerSecurityContext struct {
	RunAsUser      int `yaml:"runAsUser,omitempty"`
	RunAsGroup     int `yaml:"runAsGroup,omitempty"`
	SeLinuxOptions struct {
		Type  string `yaml:"type,omitempty"`
		Level string `yaml:"level,omitempty"`
	} `yaml:"seLinuxOptions,omitempty"`
}

type Dataset struct {
	Name      string
	MountPath string `yaml:"mountPath,omitempty"`
	S3        struct {
		Secret    string
		EnvPrefix string `yaml:"envPrefix,omitempty"`
	} `yaml:"s3,omitempty"`
	Nfs struct {
		Server string
		Path   string
	} `yaml:"nfs,omitempty"`
	Pvc struct {
		ClaimName string `yaml:"claimName"`
	} `yaml:"pvc,omitempty"`
}

type Application struct {
	ApiVersion string `yaml:"apiVersion"`
	Kind       string
	Metadata   Metadata
	Spec       struct {
		Api                      Api
		Role                     Role
		Code                     []Code                   `yaml:"code,omitempty"`
		Description              string                   `yaml:"description,omitempty"`
		SupportsGpu              bool                     `yaml:"supportsGpu,omitempty"`
		Expose                   []int                    `yaml:"expose,omitempty"`
		MinSize                  RunSize                  `yaml:"minSize,omitempty"`
		Tags                     []string                 `yaml:"tags,omitempty"`
		Repo                     string                   `yaml:"repo,omitempty"`
		Command                  string                   `yaml:"command,omitempty"`
		Image                    string                   `yaml:"image,omitempty"`
		Env                      Env                      `yaml:"env,omitempty"`
		Datasets                 []Dataset                `yaml:"datasets,omitempty"`
		SecurityContext          SecurityContext          `yaml:"securityContext,omitempty"`
		ContainerSecurityContext ContainerSecurityContext `yaml:"containerSecurityContext,omitempty"`
	}
}

type RepoSecret struct {
	ApiVersion string `yaml:"apiVersion"`
	Kind       string
	Metadata   Metadata
	Spec       struct {
		Repo   string
		Secret struct {
			Name string
		}
	}
}

type DispatchMethod string

const (
	ParameterSweepDispatch DispatchMethod = "parametersweep"
	TaskSimulatorDispatch                 = "tasksimulator"
	ApplicationDispatch                   = "application"
)

type DispatcherSweep struct {
	Min  int
	Max  int
	Step int
}

type DispatcherSchema struct {
	Format      string
	Columns     []string
	ColumnTypes []any
}

type WorkDispatcher struct {
	ApiVersion string `yaml:"apiVersion"`
	Kind       string
	Metadata   Metadata
	Spec       struct {
		Method      DispatchMethod
		Application struct {
			Name     string `yaml:"name,omitempty"`
			FromRole string `yaml:"fromRole,omitempty"`
		} `yaml:"application,omitempty"`
		Env    Env              `yaml:"env,omitempty"`
		Sweep  DispatcherSweep  `yaml:"sweep,omitempty"`
		Schema DispatcherSchema `yaml:"schema,omitempty"`
		Run    string           `yaml:"run,omitempty"`
	}
}

type TShirtSize string

const (
	XxsSize TShirtSize = "xxs"
	XsSize             = "xs"
	SmSize             = "sm"
	MdSize             = "md"
	LgSize             = "lg"
	XlSize             = "xl"
	XxlSize            = "xxl"
)

type WorkerPool struct {
	ApiVersion string `yaml:"apiVersion"`
	Kind       string
	Metadata   Metadata
	Spec       struct {
		StartupDelay string `yaml:"startupDelay,omitempty"`
		Env          Env    `yaml:"env,omitempty"`
		Workers      struct {
			Count int
			Size  TShirtSize
		}
		Target struct {
			Kubernetes struct {
				Context string
				Config  struct {
					Value string
				}
			}
		}
	}
}

type UnknownResource map[string]interface{}

type AppModel struct {
	Applications    []Application
	WorkDispatchers []WorkDispatcher
	WorkerPools     []WorkerPool
	RepoSecrets     []RepoSecret
	Others          []string
}

func parse(yamls string) (AppModel, error) {
	model := AppModel{}
	d := yaml.NewDecoder(strings.NewReader(yamls))

	for {
		var m UnknownResource
		if err := d.Decode(&m); errors.Is(err, io.EOF) {
			break
		} else if err != nil {
			fmt.Fprintf(os.Stderr, "Warning: skipping yaml with parse error %v", err)
			continue
		}

		kind, err := stringVal("kind", m)
		if err != nil {
			fmt.Fprintf(os.Stderr, "%v\n", err.Error())
		}

		bytes, err := yaml.Marshal(m)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Warning: skipping invalid yaml %v", err)
			continue
		}

		switch kind {
		case "Application":
			var r Application
			if err := yaml.Unmarshal(bytes, &r); err != nil {
				fmt.Fprintf(os.Stderr, "Warning: skipping yaml with invalid Application resource %v", err)
				continue
			} else {
				model.Applications = append(model.Applications, r)
			}

		case "PlatformRepoSecret":
			var r RepoSecret
			if err := yaml.Unmarshal(bytes, &r); err != nil {
				fmt.Fprintf(os.Stderr, "Warning: skipping yaml with invalid RepoSecret resource %v", err)
				continue
			} else {
				model.RepoSecrets = append(model.RepoSecrets, r)
			}

		case "WorkDispatcher":
			var r WorkDispatcher
			if err := yaml.Unmarshal(bytes, &r); err != nil {
				fmt.Fprintf(os.Stderr, "Warning: skipping yaml with invalid WorkDispatcher resource %v", err)
				continue
			} else {
				model.WorkDispatchers = append(model.WorkDispatchers, r)
			}

		case "WorkerPool":
			var r WorkerPool
			if err := yaml.Unmarshal(bytes, &r); err != nil {
				fmt.Fprintf(os.Stderr, "Warning: skipping yaml with invalid WorkerPool resource %v\n!!!!\n%s\n!!!!\n", err, string(bytes))
				continue
			} else {
				model.WorkerPools = append(model.WorkerPools, r)
			}

		default:
			model.Others = append(model.Others, string(bytes))
		}
	}

	return model, nil
}

func stringVal(key string, m UnknownResource) (string, error) {
	uval, ok := m[key]
	if !ok {
		return "", fmt.Errorf("Warning: skipping yaml with missing %s in %v", key, m)
	}

	val, ok := uval.(string)
	if !ok {
		return "", fmt.Errorf("Warning: skipping yaml with invalid %s in %v", key, uval)
	}

	return val, nil
}
