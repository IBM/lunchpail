import os
import re
import kopf
import base64
import random
import string
import logging
import subprocess
from kubernetes import client, config
from kubernetes.client.rest import ApiException

config.load_incluster_config()
v1Api = client.CoreV1Api()
customApi = client.CustomObjectsApi(client.ApiClient())

@kopf.on.create('runs.codeflare.dev')
@kopf.on.update('runs.codeflare.dev', field='spec')
def create_run(name, spec, patch, **kwargs):
    application_name = spec['application']

    logging.info(f"Run for application: {application_name}")

    try:
        application = customApi.get_cluster_custom_object(group="codeflare.dev", version="v1alpha1", plural="applications", name=application_name)
    except ApiException as e:
        raise kopf.PermanentError(f"Application {application_name} not found. {str(e)}")

    if not 'codeflare.dev/namespace' in application['metadata']['annotations']:
        raise Exception(f"Application {application_name} not yet configured")
        
    application_namespace = application['metadata']['annotations']['codeflare.dev/namespace']
    logging.info(f"Targeting application_namespace: {application_namespace}")

    if 'options' in spec:
        command_line_options = spec['options']
    elif 'options' in application['spec']:
        command_line_options = application['spec']['options']
    else:
        command_line_options = ""

    try:
        api = application['spec']['api']
        logging.info(f"Found application={application_name} api={api} ns={application_namespace}")

        if api == "ray":
            create_run_ray(application, application_namespace, name, spec, command_line_options, patch)
        elif api == "torch":
            create_run_torch(application, application_namespace, name, spec, command_line_options, patch)
        else:
            raise kopf.PermanentError(f"Invalid API {api} for application {application_name}.")
    except Exception as e:
        raise kopf.PermanentError(f"Error handling run creation. {str(e)}")

def create_run_ray(application, application_namespace, name, spec, command_line_options, patch):
    logging.info(f"Handling Ray Run: {application['metadata']['name']}")
    pass

def create_workdir_volumes(name, namespace):
    pv_name = os.environ.get("WORKDIR_PVC")

    pv = v1Api.read_persistent_volume(name=pv_name)
    pv_body = client.V1PersistentVolume(metadata=client.V1ObjectMeta(name=name),
                                        spec=client.V1PersistentVolumeSpec(capacity=pv.spec.capacity,
                                                                           access_modes=pv.spec.access_modes,
                                                                           mount_options=pv.spec.mount_options,
                                                                           nfs=pv.spec.nfs))
    v1Api.create_persistent_volume(pv_body)

    body = client.V1PersistentVolumeClaim(metadata=client.V1ObjectMeta(name=name, namespace=namespace),
                                          spec=client.V1PersistentVolumeClaimSpec(volume_name=name,
                                                                                  storage_class_name="",
                                                                                  access_modes=pv.spec.access_modes,
                                                                                  resources=client.V1ResourceRequirements(
                                                                                      requests=pv.spec.capacity)))
    v1Api.create_namespaced_persistent_volume_claim(namespace, body)

    return name

def create_run_torch(application, application_namespace, name, spec, command_line_options, patch):
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
            raise kopf.PermanentError(f"Error processing repo secret. {str(e)}")
    
    #coscheduler = "coscheduler_name=scheduler-plugins-scheduler"
    coscheduler = "" # TODO

    # multinic = api_instance.get_cluster_custom_object(group="k8s.cni.cncf.io", version="v1", plural="network-attachment-definitions") # TODO
    network = ""

    component = "dist.ddp"

    nnodes = 1
    nprocs_per_node = 1

    script = re.sub(r"^python\d+ ", "", command)

    rando = ''.join(random.choice(string.ascii_lowercase) for i in range(12))
    workdir_base =  f"{name}-{rando}"
    workdir = os.path.join(os.environ.get("WORKDIR"), workdir_base)
    clone_out = subprocess.run(["/src/clone.sh", name, workdir, repo, user_b64, pat_b64], capture_output=True)
    if clone_out.returncode != 0:
        raise kopf.PermanentError(f"Failed to clone workdir. {clone_out.stderr.decode('utf-8')}")
    logging.info(f"clone_out={clone_out}")
    cloned_subPath = clone_out.stdout.decode('utf-8')
    logging.info(f"cloned_subPath={cloned_subPath}")

    env = application['spec']['env'] if 'env' in application['spec'] else {}
    env['_CODEFLARE_WORKDIR'] = "/workdir"
    env_comma_separated = ",".join([f"{kv[0]}={kv[1]}" for kv in env.items()])
    env_run_arg = f"--env {env_comma_separated}" if len(env_comma_separated) > 0 else ""

    workdir_pvc_name = create_workdir_volumes(workdir_base, application_namespace)
    volumes = f"type=volume,src={workdir_pvc_name},dst=/workdir,readonly"

    resources = f"{nnodes}x{nprocs_per_node}"
    scheduler_args = f"{namespace}{image_repo}{coscheduler}{network}"

    subPath = os.path.join(workdir_base, cloned_subPath)
    logging.info(f"Torchx subPath={subPath}")

    out = subprocess.run(["/src/torchx.sh", name, subPath, image, scheduler_args, script, resources, volumes, base64.b64encode(command_line_options.encode('ascii')), base64.b64encode(env_run_arg.encode('ascii'))],
                         capture_output=True)

    logging.info(f"Torchx run output {out}")
