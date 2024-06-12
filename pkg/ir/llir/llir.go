package llir

import (
	"slices"
	"strings"
)

type Yaml struct {
	Yamls []string
}

type MarshaledYaml struct {
	Yaml string
}

type LLIR struct {
	GlobalYaml     Yaml
	ComponentYamls []Yaml
}

func marshal(yaml Yaml) MarshaledYaml {
	return MarshaledYaml{strings.Join(yaml.Yamls, "\n---\n")}
}

func (l *LLIR) Yamlset() []MarshaledYaml {
	ms := []MarshaledYaml{marshal(l.GlobalYaml)}

	for _, y := range l.ComponentYamls {
		ms = append(ms, marshal(y))
	}

	return ms
}

// This is just to present a single string form of all of the yaml,
// e.g. for dry-running.
func (l *LLIR) Yaml() string {
	ys := []string{}
	ys = slices.Concat(ys, l.GlobalYaml.Yamls)
	for _, y := range l.ComponentYamls {
		ys = slices.Concat(ys, y.Yamls)
	}
	return marshal(Yaml{ys}).Yaml
}
