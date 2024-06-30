package api

import (
	"fmt"
	"os"
	"regexp"
	"strings"

	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes/scheme"
	"lunchpail.io/pkg/fe/linker"
	"lunchpail.io/pkg/ir/llir"
	comp "lunchpail.io/pkg/lunchpail"
)

type which string

const (
	config which = "config"
	job          = "job"
	pods         = "pods"
)

func extract(which which, runname, namespace, templatePath string, values []string, verbose bool) (string, error) {
	parts, err := linker.Template(runname, namespace, templatePath, "", linker.TemplateOptions{Verbose: verbose, OverrideValues: append(values, "extract="+string(which))})
	if err != nil {
		return "", err
	}

	return parts, nil
}

// reparse marshaled jobs into typed batchv1.Job objects, because this
// helps backends interpret the LLIR
func extractJobs(runname, namespace, templatePath string, values []string, verbose bool) ([]batchv1.Job, error) {
	jobs := []batchv1.Job{}

	job, err := extract("job", runname, namespace, templatePath, values, verbose)
	if err != nil {
		return jobs, err
	}

	decode := scheme.Codecs.UniversalDeserializer().Decode
	for _, j := range strings.Split(job, "---") {
		j = trim(j)
		if len(j) == 0 {
			continue
		} else if job, gvk, err := decode([]byte(j), nil, nil); err != nil {
			if !strings.Contains(err.Error(), "Object 'Kind' is missing") {
				// TODO: why doesn't the decoder strip comments?
				return jobs, err
			}
		} else if gvk.Group != "batch" || gvk.Version != "v1" || gvk.Kind != "Job" {
			return jobs, fmt.Errorf("Non-job resource claiming to be a Job %s\n%s", gvk.Kind, j)
		} else if okjob, ok := job.(*batchv1.Job); !ok {
			return jobs, fmt.Errorf("Non-job resource claiming to be a Job\n%s", j)
		} else {
			jobs = append(jobs, *okjob)
		}
	}

	return jobs, nil
}

// TODO there has to be some way to share code here with extractJobs
// reparse marshaled jobs into typed corev1.Pod objects, because this
// helps backends interpret the LLIR
func extractPods(runname, namespace, templatePath string, values []string, verbose bool) ([]corev1.Pod, error) {
	pods := []corev1.Pod{}

	pod, err := extract("pods", runname, namespace, templatePath, values, verbose)
	if err != nil {
		return pods, err
	}

	decode := scheme.Codecs.UniversalDeserializer().Decode
	for _, j := range strings.Split(pod, "---") {
		j = trim(j)
		if len(j) == 0 {
			continue
		} else if pod, gvk, err := decode([]byte(j), nil, nil); err != nil {
			if !strings.Contains(err.Error(), "Object 'Kind' is missing") {
				// TODO: why doesn't the decoder strip comments?
				return pods, err
			}
		} else if gvk.Group != "" || gvk.Version != "v1" || gvk.Kind != "Pod" {
			return pods, fmt.Errorf("Non-pod resource claiming to be a Pod %s\n%s", gvk.Kind, j)
		} else if okpod, ok := pod.(*corev1.Pod); !ok {
			return pods, fmt.Errorf("Non-pod resource claiming to be a Pod\n%s", j)
		} else {
			pods = append(pods, *okpod)
		}
	}

	return pods, nil
}

func GenerateComponent(runname, namespace, templatePath string, values []string, verbose bool, name comp.Component) (llir.Component, error) {
	defer os.RemoveAll(templatePath)

	config, err := extract("config", runname, namespace, templatePath, values, verbose)
	if err != nil {
		return llir.Component{}, err
	}

	jobs, err := extractJobs(runname, namespace, templatePath, values, verbose)
	if err != nil {
		return llir.Component{}, err
	}

	pods, err := extractPods(runname, namespace, templatePath, values, verbose)
	if err != nil {
		return llir.Component{}, err
	}

	return llir.Component{Name: name, Jobs: jobs, Pods: pods, Config: trim(config)}, nil
}

// hmm, the client-go decoder doesn't handle comments well. without
// this, we are left with empty resources -- those consisting only of
// comment lines and ---
func trim(s string) string {
	re := regexp.MustCompile(`(?m)^\s*#([^#].*?)$`)
	s2 := strings.TrimSpace(re.ReplaceAllString(s, ""))
	if s2 == "---" || len(s2) == 0 {
		return ""
	} else {
		return s
	}
}
