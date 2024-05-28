package llir

import (
	"slices"
	"strings"
)

type Yaml struct {
	Yamls   []string
	Context string
}

type MarshaledYaml struct {
	Yaml    string
	Context string
}

type LLIR struct {
	CoreYaml Yaml
	AppYaml  []Yaml
}

func marshal(yaml Yaml) MarshaledYaml {
	return MarshaledYaml{strings.Join(yaml.Yamls, "\n---\n"), yaml.Context}
}

func (l *LLIR) Yamlset() []MarshaledYaml {
	ms := []MarshaledYaml{marshal(l.CoreYaml)}

	for _, y := range l.AppYaml {
		ms = append(ms, marshal(y))
	}

	return ms
}

// Intentionally ignorant of Context. This is just to present a single
// string form of all of the yaml, e.g. for dry-running.
func (l *LLIR) Yaml() string {
	ys := []string{}
	ys = slices.Concat(ys, l.CoreYaml.Yamls)
	for _, y := range l.AppYaml {
		ys = slices.Concat(ys, y.Yamls)
	}
	return marshal(Yaml{ys, ""}).Yaml
}
