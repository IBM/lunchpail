package llir

import (
	"strings"

	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime/serializer/json"
	"k8s.io/client-go/kubernetes/scheme"
)

// One Component for WorkStealer, one for Dispatcher, and each per WorkerPool
type Component struct {
	// Singleton runners
	Pods []corev1.Pod

	// Groups of runners, with group size=_.Spec.Parallelism
	Jobs []batchv1.Job

	// ConfigMaps, Secrets, etc. Non-runnable things to be applied
	// to the runners in this Component.
	Config string
}

type LLIR struct {
	// ConfigMaps, Secrets, etc. Non-runnable things to applied to all Components
	GlobalConfig string

	// One Component for WorkStealer, one for Dispatcher, and each per WorkerPool
	Components []Component
}

func Join(ys []string) string {
	return strings.Join(ys, "\n---\n")
}

func (l *LLIR) MarshalArray() ([]string, error) {
	s := json.NewYAMLSerializer(json.DefaultMetaFactory, scheme.Scheme,
		scheme.Scheme)

	ys := []string{l.GlobalConfig}

	for _, c := range l.Components {
		ys = append(ys, c.Config)

		for _, j := range c.Pods {
			buf := new(strings.Builder)
			if err := s.Encode(&j, buf); err != nil {
				return ys, err
			}

			ys = append(ys, buf.String())
		}

		for _, j := range c.Jobs {
			buf := new(strings.Builder)
			if err := s.Encode(&j, buf); err != nil {
				return ys, err
			}

			ys = append(ys, buf.String())
		}
	}

	return ys, nil
}

// This is to present a single string form of all of the yaml,
// e.g. for dry-running.
func (l *LLIR) Marshal() (string, error) {
	if a, err := l.MarshalArray(); err != nil {
		return "", err
	} else {
		return Join(a), nil
	}
}
