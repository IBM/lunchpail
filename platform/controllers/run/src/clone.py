import re
import logging
import subprocess

def fetch_secret(v1Api, name: str, namespace: str):
    repo_secret = v1Api.read_namespaced_secret(name, namespace)
    user_b64 = repo_secret.data['user']
    pat_b64 = repo_secret.data['pat']
    return user_b64, pat_b64

def clone(v1Api, customApi, application, name: str, workdir: str):
    repo = application['spec']['repo']
    user_b64 = ""
    pat_b64 = ""

    if 'repoSecret' in application['spec']:
        # then the Application spec defined the repoSecret reference directly
        try:
            repo_secret_spec = application['spec']['repoSecret']
            user_b64, pat_b64 = fetch_secret(v1Api, repo_secret_spec['name'], repo_secret_spec['namespace'])
        except Exception as e:
            raise PermanentError(f"Error processing repo secret. {str(e)}")
    else:
        # otherwise, see if we have a matching PlatformRepoSecret
        try:
            allRepos = customApi.list_cluster_custom_object(group="codeflare.dev", version="v1alpha1", plural="platformreposecrets")['items']
            logging.info(f"PlatformRepos {allRepos}")
            matchingRepos = list(filter(lambda prs: re.search(prs['spec']['repo'], repo) is not None,
                                        allRepos))
            if len(matchingRepos) > 0:
                # We found a matching PlatformRepoSecret! TODO which one?
                prs = matchingRepos[0]['spec']
                logging.info(f"PlatformRepos match {prs}")
                try:
                    secret_name = prs['secret']['name']
                    secret_namespace = prs['secret']['namespace']
                    user_b64, pat_b64 = fetch_secret(v1Api, secret_name, secret_namespace)
                except Exception as e:
                    raise PermanentError(f"Error processing repo secret from PlatformRepoSecret. {str(e)}")
        except Exception as e:
            logging.info(f"Unable to find any platform repo secrets {e}")

    clone_out = subprocess.run(["/src/clone.sh", name, workdir, repo, user_b64, pat_b64], capture_output=True)
    if clone_out.returncode != 0:
        raise PermanentError(f"Failed to clone workdir. {clone_out.stderr.decode('utf-8')}")

    logging.info(f"clone_out={clone_out}")
    cloned_subPath = clone_out.stdout.decode('utf-8')
    logging.info(f"cloned_subPath={cloned_subPath}")

    return cloned_subPath
