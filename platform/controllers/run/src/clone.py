import re
import logging
import subprocess
from kopf import PermanentError

def fetch_secret(v1Api, name: str, namespace: str):
    repo_secret = v1Api.read_namespaced_secret(name, namespace)
    user_b64 = repo_secret.data['user']
    pat_b64 = repo_secret.data['pat']
    return user_b64, pat_b64

def clone(v1Api, customApi, application, name: str, workdir: str):
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
    logging.info(f"cloned_subPath={cloned_subPath}")

    return cloned_subPath
