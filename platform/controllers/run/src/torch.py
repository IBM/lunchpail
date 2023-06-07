import os
import re
import base64
import random
import string
import logging
import subprocess
from kubernetes import client
from kopf import PermanentError

def create_run_torch(v1Api, application, application_namespace, name, spec, command_line_options, run_size_config, patch):
    logging.info(f"Handling Torch Run: {application['metadata']['name']}")
    image = application['spec']['image']
    repo = application['spec']['repo']
    command = application['spec']['command']

    namespace = f"namespace={application_namespace}"
    image_repo = f",image_repo={os.path.dirname(image)}"

    if 'repoSecret' in application['spec']:
        try:
            repo_secret_spec = application['spec']['repoSecret']
            repo_secret = v1Api.read_namespaced_secret(name=repo_secret_spec['name'], namespace=repo_secret_spec['namespace'])
            user_b64 = repo_secret.data['user']
            pat_b64 = repo_secret.data['pat']
        except Exception as e:
            raise PermanentError(f"Error processing repo secret. {str(e)}")
    
    #coscheduler = "coscheduler_name=scheduler-plugins-scheduler"
    coscheduler = "" # TODO

    # multinic = api_instance.get_cluster_custom_object(group="k8s.cni.cncf.io", version="v1", plural="network-attachment-definitions") # TODO
    network = ""

    component = "dist.ddp"

    nnodes = 1
    nprocs_per_node = 1

    script = re.sub(r"^python\d+ ", "", command)

    rando = ''.join(random.choice(string.ascii_lowercase) for i in range(12))
    run_id =  f"torch-{name}-{rando}"
    workdir = os.path.join(os.environ.get("WORKDIR"), run_id)
    clone_out = subprocess.run(["/src/clone.sh", name, workdir, repo, user_b64, pat_b64], capture_output=True)
    if clone_out.returncode != 0:
        raise PermanentError(f"Failed to clone workdir. {clone_out.stderr.decode('utf-8')}")
    logging.info(f"clone_out={clone_out}")
    cloned_subPath = clone_out.stdout.decode('utf-8')
    logging.info(f"cloned_subPath={cloned_subPath}")

    env = application['spec']['env'] if 'env' in application['spec'] else {}
    env['_CODEFLARE_WORKDIR'] = "/workdir"
    env_comma_separated = ",".join([f"{kv[0]}={kv[1]}" for kv in env.items()])
    env_run_arg = f"--env {env_comma_separated}" if len(env_comma_separated) > 0 else ""

    patch.metadata.labels['app.kubernetes.io/instance'] = run_id
    # patch.metadata.annotations['codeflare.dev/namespace'] = application_namespace

    labels = {"app.kubernetes.io/managed-by": "codeflare.dev", "app.kubernetes.io/instance": run_id}

    # for now, we will handle nfs mounting of the workdir in torchx.sh
    volumes = ""

    scheduler_args = f"{namespace}{image_repo}{coscheduler}{network}"

    subPath = os.path.join(run_id, cloned_subPath)
    logging.info(f"Torchx subPath={subPath}")

    gpus = run_size_config['gpu']
    cpus = run_size_config['cpu']
    memory = run_size_config['memory']
    nprocs = run_size_config['workers']
    nprocs_per_node = 1 if gpus == 0 else gpus
    
    torchx_out = subprocess.run([
        "/src/torchx.sh",
        name, # $1
        run_id, # $2
        subPath, # $3
        image, # $4
        str(nprocs), # $5
        str(nprocs_per_node), # $6
        str(gpus), # $7
        str(cpus), # $8
        str(memory), # $9
        scheduler_args, # $10
        script, # $11
        volumes, # $12
        base64.b64encode(command_line_options.encode('ascii')),
        base64.b64encode(env_run_arg.encode('ascii'))
    ], capture_output=True)

    if torchx_out.returncode != 0:
        raise PermanentError(f"Failed to launch via torchx. {torchx_out.stderr.decode('utf-8')}")

    head_pod_name = torchx_out.stdout.decode('utf-8')
    logging.info(f"Torchx run head_pod_name={head_pod_name}")
