import os
import json
import base64
import logging
import subprocess
from kopf import PermanentError

from clone import clone
from run_id import alloc_run_id

def create_run_ray(v1Api, application, namespace: str, name: str, spec, command_line_options, run_size_config, patch):
    logging.info(f"Handling Ray Run: {application['metadata']['name']}")

    image = application['spec']['image']
    command = application['spec']['command']
    requirements = application['spec']['requirements']
    env = application['spec']['env'] if 'env' in application['spec'] else {}

    runtimeEnv = { "env_vars": env, "pip": requirements }

    run_id, workdir = alloc_run_id("ray", name)
    cloned_subPath = clone(v1Api, application, name, workdir)
    subPath = os.path.join(run_id, cloned_subPath)

    gpu = run_size_config['gpu']
    cpu = run_size_config['cpu']
    memory = run_size_config['memory']
    nWorkers = run_size_config['workers']

    logging.info(f"About to call out to ray run_id={run_id} subPath={subPath}")
    ray_out = subprocess.run([
        "/src/ray.sh",
        name,
        namespace,
        run_id,
        image,
        command,
        subPath,
        str(nWorkers),
        str(cpu),
        str(memory),
        str(gpu),
        base64.b64encode(json.dumps(runtimeEnv).encode('ascii'))
    ], capture_output=True)
    logging.info(f"Ray callout done with returncode={ray_out.returncode}")

    if ray_out.returncode != 0:
        raise PermanentError(f"Failed to launch via ray. {ray_out.stderr.decode('utf-8')}")
    else:
        logging.info(f"Ray out {ray_out.stdout.decode('utf-8')}")
        logging.info(f"Ray err {ray_out.stderr.decode('utf-8')}")
