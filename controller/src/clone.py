import os
import re
import logging
from kopf import PermanentError

def fetch_secret(v1Api, name: str, namespace: str):
    repo_secret = v1Api.read_namespaced_secret(name, namespace)
    user_b64 = repo_secret.data['user']
    pat_b64 = repo_secret.data['pat']
    return user_b64, pat_b64

def clonev2_from_git(v1Api, customApi, namespace: str, repo: str):
    user_b64 = ""
    pat_b64 = ""

    # see if we have a matching PlatformRepoSecret
    try:
        allRepos = customApi.list_namespaced_custom_object(group="lunchpail.io", version="v1alpha1", plural="platformreposecrets", namespace=namespace)['items']
        logging.info(f"PlatformRepoSecrets {allRepos}")
        matchingRepos = list(filter(lambda prs: re.search(prs['spec']['repo'], repo) is not None,
                                    allRepos))
        if len(matchingRepos) > 0:
            # We found a matching PlatformRepoSecret! TODO which one?
            prs = matchingRepos[0]['spec']
            logging.info(f"PlatformRepoSecrets match {prs}")
            try:
                secret_name = prs['secret']['name']
                secret_namespace = namespace
                user_b64, pat_b64 = fetch_secret(v1Api, secret_name, secret_namespace)
            except Exception as e:
                raise PermanentError(f"Error processing PlatformRepoSecret matches={matchingRepos}. {str(e)}")
    except Exception as e:
        logging.info(f"Error finding PlatformRepoSecret. {str(e)}")

    return repo, user_b64, pat_b64, None, None

def clonev2_from_literal(codeSpecs):
    cm_data = {}
    cm_mount_path = ""

    for codeSpec in codeSpecs:
        key = os.path.basename(codeSpec['name'])
        cm_mount_path = os.path.dirname(codeSpec['name']) # TODO error checking for differences
        cm_data[key] = codeSpec['source']

    return cm_data, cm_mount_path

def clonev2(v1Api, customApi, application, namespace: str):
    if 'code' in application['spec']:
        # then the Application specifies a `spec.code` literal
        # (i.e. inlined code directly in the Application yaml)
        data, mount_path = clonev2_from_literal(application['spec']['code'])
        return "", "", "", data, mount_path
    else:
        # otherwise the Application specifies code via a reference to
        # a github `spec.repo`
        return clonev2_from_git(v1Api, customApi, namespace, application['spec']['repo'])
