import os
import json
import base64
import logging
import subprocess
from kopf import PermanentError

from clone import clone
from run_id import alloc_run_id

def create_run_shell(v1Api, customApi, application, namespace: str, uid: str, name: str, part_of: str, step: str, spec, command_line_options, run_size_config, dataset_labels, patch):
    logging.info(f"Handling Shell Run: app={application['metadata']['name']} run={name} part_of={part_of} step={step}")

    image = application['spec']['image']
    command = f"{application['spec']['command']} {command_line_options}"

    run_id, workdir = alloc_run_id("shell", name)
    cloned_subPath = clone(v1Api, customApi, application, name, workdir)
    subPath = os.path.join(run_id, cloned_subPath)

    gpu = run_size_config['gpu']
    cpu = run_size_config['cpu']
    memory = run_size_config['memory']
    nWorkers = run_size_config['workers']

    # environment variables; merge application spec with run spec
    env = application['spec']['env'] if 'env' in application['spec'] else {}
    if 'env' in spec:
        env.update(spec['env'])

    try:
        shell_out = subprocess.run([
            "/src/shell.sh",
            uid,
            name,
            namespace,
            part_of,
            step,
            run_id,
            image,
            command,
            subPath,
            str(nWorkers),
            str(cpu),
            str(memory),
            str(gpu),
            base64.b64encode(json.dumps(env).encode('ascii')),
        ], capture_output=True)

        logging.info(f"Shell callout done for name={name} with returncode={shell_out.returncode}")
    except Exception as e:
        raise PermanentError(f"Failed to launch via shell. {e}")

    if shell_out.returncode != 0:
        raise PermanentError(f"Failed to launch via shell. {shell_out.stderr.decode('utf-8')}")
    else:
        head_pod_name = shell_out.stdout.decode('utf-8')
        logging.info(f"Shell run head_pod_name={head_pod_name}")
        return head_pod_name
        
        
