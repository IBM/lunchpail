package linker

import (
	"fmt"
	"lunchpail.io/pkg/fe/linker/helm"
	"path/filepath"
	"slices"
	"strings"
)

type data map[string]string

func fetch_secret(name, namespace string) (string, error) {
	// repo_secret = v1Api.read_namespaced_secret(name, namespace)
	// user_b64 = repo_secret.data['user']
	// pat_b64 = repo_secret.data['pat']
	// return user_b64, pat_b64
	return "", nil
}

func codeFromGit(namespace, repo string, repoSecrets []RepoSecret) (string, string) {
	// see if we have a matching PlatformRepoSecret
	repoSecretIdx := slices.IndexFunc(repoSecrets, func(rs RepoSecret) bool { return strings.Contains(repo, rs.Spec.Repo) })
	if repoSecretIdx >= 0 {
		return repo, repoSecrets[repoSecretIdx].Spec.Secret.Name
	}

	return repo, ""
}

func codeFromLiteral(codeSpecs []Code) (data, string) {
	cm_data := data{}
	cm_mount_path := ""

	for _, codeSpec := range codeSpecs {
		key := filepath.Base(codeSpec.Name)
		cm_mount_path = filepath.Dir(codeSpec.Name) // TODO error checking for differences
		cm_data[key] = codeSpec.Source
	}

	return cm_data, cm_mount_path
}

func code(application Application, namespace string, repoSecrets []RepoSecret) (string, string, data, string, error) {
	if len(application.Spec.Code) > 0 {
		// then the Application specifies a `spec.code` literal
		// (i.e. inlined code directly in the Application yaml)
		d, mount_path := codeFromLiteral(application.Spec.Code)
		return "", "", d, mount_path, nil
	} else if application.Spec.Repo != "" {
		// otherwise the Application specifies code via a reference to
		// a github `spec.repo`
		repo, secretName := codeFromGit(namespace, application.Spec.Repo, repoSecrets)
		return repo, secretName, data{}, "", nil
	} else {
		return "", "", data{}, "", fmt.Errorf("Application spec is missing either `code` or `repo` field")
	}
}

func codeB64(application Application, namespace string, repoSecrets []RepoSecret) (string, string, string, string, error) {
	a, b, d, e, err := code(application, namespace, repoSecrets)
	if err != nil {
		return a, b, "", e, err
	}

	ds, err := helm.ToJsonB64(d)
	return a, b, ds, e, err
}
