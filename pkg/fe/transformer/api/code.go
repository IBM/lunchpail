package api

import (
	"fmt"
	"lunchpail.io/pkg/ir/hlir"
	"lunchpail.io/pkg/util"
	"path/filepath"
	"slices"
	"strings"
)

type data map[string]string

func codeFromGit(namespace, repo string, repoSecrets []hlir.RepoSecret) (string, string) {
	// see if we have a matching RepoSecret
	repoSecretIdx := slices.IndexFunc(repoSecrets, func(rs hlir.RepoSecret) bool { return strings.Contains(repo, rs.Spec.Repo) })
	if repoSecretIdx >= 0 {
		return repo, repoSecrets[repoSecretIdx].Spec.Secret.Name
	}

	return repo, ""
}

func codeFromLiteral(codeSpecs []hlir.Code) (data, string) {
	cm_data := data{}
	cm_mount_path := ""

	for _, codeSpec := range codeSpecs {
		key := filepath.Base(codeSpec.Name)
		cm_mount_path = filepath.Dir(codeSpec.Name) // TODO error checking for differences
		cm_data[key] = codeSpec.Source
	}

	return cm_data, cm_mount_path
}

func code(application hlir.Application, namespace string, repoSecrets []hlir.RepoSecret) (string, string, data, string, error) {
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
	} else if application.Spec.Command == "" {
		return "", "", data{}, "", fmt.Errorf("Application spec is missing either `code` or `repo` field")
	} else {
		return "", "", data{}, "", nil
	}
}

func CodeB64(application hlir.Application, namespace string, repoSecrets []hlir.RepoSecret) (string, string, string, string, error) {
	a, b, d, e, err := code(application, namespace, repoSecrets)
	if err != nil {
		return a, b, "", e, err
	}

	ds, err := util.ToJsonB64(d)
	return a, b, ds, e, err
}
