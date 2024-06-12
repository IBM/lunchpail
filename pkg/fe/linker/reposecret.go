package linker

import (
	"fmt"
	"regexp"

	"lunchpail.io/pkg/ir/hlir"
)

func gatherRepoSecrets(cliSecrets []string) ([]hlir.RepoSecret, error) {
	secrets := []hlir.RepoSecret{}

	pattern := regexp.MustCompile("^([^:]+):([^@]+)@(.+)$")
	for idx, raw := range cliSecrets {
		if match := pattern.FindStringSubmatch(raw); len(match) != 4 {
			return secrets, fmt.Errorf("repo secret option must be of the form <user>:<pat>@<githubUrl>: %s", raw)
		} else {
			secrets = append(secrets, hlir.RepoSecret{
				ApiVersion: "lunchpail.io/v1alpha1",
				Kind:       "PlatformRepoSecret",
				Metadata:   hlir.Metadata{Name: fmt.Sprintf("prs_%d", idx)},
				Spec: hlir.RepoSecretSpec{
					User: match[1],
					Pat:  match[2],
					Repo: match[3],
				},
			})
		}
	}

	return secrets, nil
}
