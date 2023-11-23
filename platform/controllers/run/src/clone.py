import os
import re
import logging
import subprocess
from kopf import PermanentError

def fetch_secret(v1Api, name: str, namespace: str):
    repo_secret = v1Api.read_namespaced_secret(name, namespace)
    user_b64 = repo_secret.data['user']
    pat_b64 = repo_secret.data['pat']
    return user_b64, pat_b64

#
# Perform a git clone on the `application.spec.repo` and return the
# path to the local clone. This returned path will include the local
# prefix plus the subpath inside the repo as specified by that `repo`
# spec.
#
def clone_from_git(v1Api, customApi, application, name: str, workdir: str):
    repo = application['spec']['repo']
    user_b64 = ""
    pat_b64 = ""

    # see if we have a matching PlatformRepoSecret
    try:
        allRepos = customApi.list_cluster_custom_object(group="codeflare.dev", version="v1alpha1", plural="platformreposecrets")['items']
        logging.info(f"PlatformRepoSecrets {allRepos}")
        matchingRepos = list(filter(lambda prs: re.search(prs['spec']['repo'], repo) is not None,
                                    allRepos))
        if len(matchingRepos) > 0:
            # We found a matching PlatformRepoSecret! TODO which one?
            prs = matchingRepos[0]['spec']
            logging.info(f"PlatformRepoSecrets match {prs}")
            try:
                secret_name = prs['secret']['name']
                secret_namespace = prs['secret']['namespace']
                user_b64, pat_b64 = fetch_secret(v1Api, secret_name, secret_namespace)
            except Exception as e:
                raise PermanentError(f"Error processing PlatformRepoSecret matches={matchingRepos}. {str(e)}")
    except Exception as e:
        logging.info(f"Error finding PlatformRepoSecret. {str(e)}")

    clone_out = subprocess.run(["/src/clone.sh", name, workdir, repo, user_b64, pat_b64], capture_output=True)
    if clone_out.returncode != 0:
        raise PermanentError(f"Failed to clone code. {clone_out.stderr.decode('utf-8')}")

    logging.info(f"clone_out={clone_out}")
    cloned_subPath = clone_out.stdout.decode('utf-8')

    return cloned_subPath

# Extract the code literal inside of the `application.spec.code` and
# place it in a file named by the last argument of
# `application.spec.command`
def pseudo_clone_from_literal(application, workdir: str):
    logging.info(f"Using code from literal for application={application['metadata']['name']}")

    code = application['spec']['code']
    command = application['spec']['command']
    filename = command[command.rindex(' ')+1:]
    filepath = os.path.join(workdir, filename)
    os.makedirs(workdir)
    
    with open(filepath, mode="wt") as f:
        f.write(code)

    return "."
#
# If the application is specified as pulling code from a git repo,
# then invoke `clone_from_git` otherwise invoke
# `pseudo_clone_from_literal`.
#
def clone(v1Api, customApi, application, name: str, workdir: str):
    if 'code' in application['spec']:
        # then the Application specifies a `spec.code` literal
        # (i.e. inlined code directly in the Application yaml)
        cloned_subPath = pseudo_clone_from_literal(application, workdir)
    else:
        # otherwise the Application specifies code via a reference to
        # a github `spec.repo`
        cloned_subPath = clone_from_git(v1Api, customApi, application, name, workdir)

    logging.info(f"cloned_subPath={cloned_subPath}")
    return cloned_subPath
