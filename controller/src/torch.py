import os
import re
import base64
import logging
import subprocess
from kubernetes import client
from kopf import PermanentError

from clone import clone
from run_id import alloc_run_id
from image_pull_secret import find_image_pull_secret

def create_run_torch(v1Api, customApi, application, namespace: str, uid: str, name: str, part_of: str, step: str, spec, command_line_options, run_size_config, dataset_labels, volumes, volumeMounts, patch):
    logging.info(f"Handling Torch Run: app={application['metadata']['name']} run={name} part_of={part_of} step={step}")
    command = application['spec']['command']

    image = application['spec']['image']
    imagePullSecret = find_image_pull_secret(v1Api, customApi, image, namespace)
    
    component = "dist.ddp"

    nnodes = 1
    nprocs_per_node = 1

    script = re.sub(r"^python\d+ ", "", command)

    env = application['spec']['env'] if 'env' in application['spec'] else {}
    env['_CODEFLARE_WORKDIR'] = "/workdir"
    env_comma_separated = ",".join([f"{kv[0]}={kv[1]}" for kv in env.items()])
    env_run_arg = f"--env {env_comma_separated}" if len(env_comma_separated) > 0 else ""

    run_id, workdir = alloc_run_id("torch", name)

    patch.metadata.labels['app.kubernetes.io/instance'] = run_id
    # patch.metadata.annotations['lunchpail.io/namespace'] = application_namespace

    labels = {"app.kubernetes.io/managed-by": "lunchpail.io", "app.kubernetes.io/instance": run_id}

    # for now, we will handle nfs mounting of the workdir in torchx.sh
    volumes = ""

    # TODO multinic = api_instance.get_cluster_custom_object(group="k8s.cni.cncf.io", version="v1", plural="network-attachment-definitions") # TODO
    scheduler_args = [
        f"namespace={namespace}",
    ]

    # if os.getenv("JAAS_USE_GANG_SCHEDULING") is not None:
    #      # TODO keep this in sync somehow with the helm chart, where the name is also specified
    #     scheduler_args.append("coscheduler_name=scheduler-plugins-scheduler")

    if imagePullSecret is not None:
        scheduler_args.append(f"image_secret={imagePullSecret}")

    cloned_subPath = clone(v1Api, customApi, application, name, namespace, workdir)
    subPath = os.path.join(run_id, cloned_subPath)
    logging.info(f"Torchx subPath={subPath}")

    gpus = run_size_config['gpu']
    cpus = run_size_config['cpu']
    memory = run_size_config['memory']
    nprocs = run_size_config['workers']
    nprocs_per_node = 1 if gpus == 0 else gpus

    try:
        proc = subprocess.Popen([
            "./torchx.sh",
            uid, # $1
            name, # $2
            namespace, # $3
            part_of, # $4
            step, # $5
            run_id, # $6
            subPath, # $7
            image, # $8
            str(nprocs), # $9
            str(nprocs_per_node), # $10
            str(gpus), # $11
            str(cpus), # $12
            str(memory), # $13
            ",".join(scheduler_args), # $14
            script, # $15
            volumes, # $16
            base64.b64encode(dataset_labels.encode('ascii')) if dataset_labels is not None else "", # $17
            base64.b64encode(command_line_options.encode('ascii')),
            base64.b64encode(env_run_arg.encode('ascii'))
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        logging.info(f"Torchx callout done for name={name} with returncode={proc.returncode}")

        stdout, stderr = proc.communicate(timeout=30)
        if proc.returncode != 0:
            raise PermanentError(f"Failed to launch via torchx (3). {stderr}")

        head_pod_name = stdout
        logging.info(f"Torchx run head_pod_name={head_pod_name} returncode={proc.returncode}")
        return head_pod_name

    except subprocess.TimeoutExpired as e:
        proc.kill()
        stdout, stderr = proc.communicate()
        raise PermanentError(f"Failed to launch via torchx (1). {str(e)}\n----------------stdout----------------\n{stdout}\n----------------stderr----------------\n{stderr}")
    except Exception as e:
        raise PermanentError(f"Failed to launch via torchx (2). {str(e)}")
