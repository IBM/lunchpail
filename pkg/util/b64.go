package util

import (
	"bytes"
	b64 "encoding/base64"
	"encoding/json"
	"fmt"
	"gopkg.in/yaml.v3"
	"strconv"
	"strings"
)

func ToArray(A []int) string {
	S := []string{}
	for _, a := range A {
		S = append(S, strconv.Itoa(a))
	}

	return "{" + strings.Join(S, ",") + "}"
}

func ToB64Array(A []string) string {
	return "{" + strings.Join(A, ",") + "}"
}

func ToPortArray(A []string) string {
	portArray := []string{}
	for _, port := range A {
		if !strings.Contains(port, ":") {
			portArray = append(portArray, fmt.Sprintf("%s:%s", port, port))
		} else {
			portArray = append(portArray, port)
		}
	}

	return "{" + strings.Join(portArray, ",") + "}"
}

func toB64(b []byte) string {
	if len(b) == 0 || bytes.Compare(b, []byte{'{', '}'}) == 0 || bytes.Compare(b, []byte{'[', ']'}) == 0 || bytes.Compare(b, []byte{'{', '}', '\n'}) == 0 || bytes.Compare(b, []byte{'[', '{', '}', ']'}) == 0 || bytes.Compare(b, []byte{'[', '{', '}', ']', '\n'}) == 0 {
		return ""
	}
	return b64.StdEncoding.EncodeToString(b)
}

func ToJsonB64(something any) (string, error) {
	b, err := json.Marshal(something)
	if err != nil {
		return "", err
	}
	return toB64(b), nil
}

type EnvEntry struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

func ToJsonEnvB64(env map[string]string) (string, error) {
	var entries []EnvEntry
	for k, v := range env {
		entries = append(entries, EnvEntry{k, v})
	}

	b, err := json.Marshal(entries)
	if err != nil {
		return "", err
	}
	return toB64(b), nil
}

func ToYamlB64(something any) (string, error) {
	b, err := yaml.Marshal(something)
	if err != nil {
		return "", err
	}
	return toB64(b), nil
}
