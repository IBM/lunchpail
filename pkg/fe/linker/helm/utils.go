package helm

import (
	"bytes"
	b64 "encoding/base64"
	"encoding/json"
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

func toB64(b []byte) string {
	if len(b) == 0 || bytes.Compare(b, []byte{'{','}'}) == 0 || bytes.Compare(b, []byte{'[',']'}) == 0  || bytes.Compare(b, []byte{'{','}','\n'}) == 0 || bytes.Compare(b, []byte{'[','{','}',']'}) == 0 || bytes.Compare(b, []byte{'[','{','}',']','\n'}) == 0 {
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

func ToYamlB64(something any) (string, error) {
	b, err := yaml.Marshal(something)
	if err != nil {
		return "", err
	}
	return toB64(b), nil
}
