import logging
import subprocess
from kopf import PermanentError

def clone(v1Api, application, name: str, workdir: str):
    repo = application['spec']['repo']

    if 'repoSecret' in application['spec']:
        try:
            repo_secret_spec = application['spec']['repoSecret']
            repo_secret = v1Api.read_namespaced_secret(name=repo_secret_spec['name'], namespace=repo_secret_spec['namespace'])
            user_b64 = repo_secret.data['user']
            pat_b64 = repo_secret.data['pat']
        except Exception as e:
            raise PermanentError(f"Error processing repo secret. {str(e)}")

    clone_out = subprocess.run(["/src/clone.sh", name, workdir, repo, user_b64, pat_b64], capture_output=True)
    if clone_out.returncode != 0:
        raise PermanentError(f"Failed to clone workdir. {clone_out.stderr.decode('utf-8')}")

    logging.info(f"clone_out={clone_out}")
    cloned_subPath = clone_out.stdout.decode('utf-8')
    logging.info(f"cloned_subPath={cloned_subPath}")

    return cloned_subPath
