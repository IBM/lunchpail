package ir

import (
	"slices"
	"strings"
)

type LLIR struct {
	CoreYaml []string
	AppYaml []string
}

func marshal(set []string) string {
	return strings.Join(set, "\n---\n")
}

func (l *LLIR) Yamlset() []string {
	return []string{marshal(l.CoreYaml), marshal(l.AppYaml)}
}

func (l *LLIR) Yaml() string {
	return marshal(slices.Concat(l.CoreYaml, l.AppYaml))
}
