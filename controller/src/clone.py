import os
import re
import stat
import logging
import subprocess
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

#
# Perform a git clone on the `application.spec.repo` and return the
# path to the local clone. This returned path will include the local
# prefix plus the subpath inside the repo as specified by that `repo`
# spec.
#
def clone_from_git(v1Api, customApi, name: str, namespace: str, workdir: str, repo: str):
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

    clone_out = subprocess.run(["./clone.sh", name, workdir, repo, user_b64, pat_b64], capture_output=True)
    if clone_out.returncode != 0:
        raise PermanentError(f"Failed to clone code. {clone_out.stderr.decode('utf-8')}")

    logging.info(f"clone_out={clone_out}")
    cloned_subPath = clone_out.stdout.decode('utf-8')

    return cloned_subPath

# Extract the code literal inside of the `application.spec.code` and
# place it in a file named by the last argument of
# `application.spec.command`
def pseudo_clone_from_literal(application, workdir: str):
    codes = application['spec']['code']

    for codeSpec in codes:
        code = codeSpec['source']
        filename = codeSpec['name']
        filepath = os.path.normpath(os.path.join(workdir, filename))

        logging.info(f"Using code from literal for application={application['metadata']['name']} and storing to filepath={filepath}")
        clone_out = subprocess.run(["rclone", "rcat", f"s3:{filepath}"], input=code, capture_output=True, text=True)

        if clone_out.returncode != 0:
            msg = clone_out.stderr if isinstance(clone_out.stderr, str) else clone_out.stderr.decode('utf-8')
            raise PermanentError(f"Failed to clone literal code. {msg}")

        logging.info(f"clone_out={clone_out}")

    # this means there is no sub-directory structure for this case of
    # using literal code provideded in the Application spec
    return "."
#
# If the application is specified as pulling code from a git repo,
# then invoke `clone_from_git` otherwise invoke
# `pseudo_clone_from_literal`.
#
def clone(v1Api, customApi, application, name: str, namespace: str, workdir: str):
    if 'code' in application['spec']:
        # then the Application specifies a `spec.code` literal
        # (i.e. inlined code directly in the Application yaml)
        cloned_subPath = pseudo_clone_from_literal(application, workdir)
    else:
        # otherwise the Application specifies code via a reference to
        # a github `spec.repo`
        cloned_subPath = clone_from_git(v1Api, customApi, name, namespace, workdir, application['spec']['repo'])

    logging.info(f"cloned_subPath={cloned_subPath}")
    return cloned_subPath
