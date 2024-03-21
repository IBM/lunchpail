import os
import json
import base64
import logging
import subprocess
from kopf import PermanentError

from clone import clone
from run_id import alloc_run_id
from datasets import add_dataset, to_string

def create_run_shell(v1Api, customApi, application, namespace: str, uid: str, name: str, part_of: str, step: str, spec, command_line_options, run_size_config, dataset_labels_arr, volumes, volumeMounts, patch):
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

    # are we to be associated with a task queue?
    if 'queue' in spec:
        queue_spec = spec['queue']['dataset']
        queue_useas = queue_spec['useas'] if 'useas' in queue_spec else 'mount'
        queue_dataset = queue_spec['name']
        dataset_labels = add_dataset(queue_dataset, queue_useas, dataset_labels_arr)
    elif dataset_labels_arr is not None and len(dataset_labels_arr) > 0:
        dataset_labels = to_string(dataset_labels_arr)
    else:
        dataset_labels = None

    try:
        shell_out = subprocess.run([
            "./shell.sh",
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
            base64.b64encode(dataset_labels.encode('ascii')) if dataset_labels is not None else "",
            base64.b64encode(json.dumps(volumes).encode('ascii')) if volumes is not None and len(volumes) > 0 else "",
            base64.b64encode(json.dumps(volumeMounts).encode('ascii')) if volumeMounts is not None and len(volumeMounts) > 0 else "",
            "{" + application["spec"]["expose"].join(",")+ "}" if "expose" in application["spec"] and len(application["spec"]["expose"]) > 0 else "",
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
        
        
