import os
import json
import base64
import logging
import subprocess

from kopf import PermanentError, TemporaryError
from kubernetes.client.rest import ApiException

from clone import clonev2
from run_id import alloc_run_id
from find_run import find_run
from run_size import load_run_size_config

# parse 6s/6m/6d/6w into units of seconds
def startup_delay_from_spec(delayString: str):
    seconds_per_unit = {"s": 1, "m": 60, "h": 3600, "d": 86400, "w": 604800}
    unit = seconds_per_unit[delayString[-1]] if delayString[-1] in seconds_per_unit else None

    if unit is None:
        # then we were given just a number, which we will interpret as
        # seconds
        unit = 1
        quantity = delayString
    else:
        quantity = delayString[:-1]

    return int(quantity) * unit

# FIXME this is duplicated from run_size.py because that code looks in
# spec['supportsGpu'] whereas we have spec['workers']['supportsGpu']
def run_size(customApi, spec, application):
    count = spec['workers']['count']
    size = spec['workers']['size']

    logging.info(f"Loading WorkerPool run_size config size={size}")
    run_size_config = load_run_size_config(customApi, size)
    logging.info(f"Loaded WorkerPool run_size config size={size} config={run_size_config}")

    poolAskedForGpu = 'supportsGpu' in spec['workers'] and spec['workers']['supportsGpu'] == True
    poolDisabledGpu = 'supportsGpu' in spec['workers'] and spec['workers']['supportsGpu'] == False
    appSupportsGpu = 'supportsGpu' in application['spec'] and application['spec']['supportsGpu'] == True
    if not appSupportsGpu or not poolAskedForGpu or poolDisabledGpu:
        # then the application or pool asked for a gpu; check to see if the pool overrides this
        logging.info(f"Disabling GPU for this pool")
        run_size_config['gpu'] = 0
    
    gpu = run_size_config['gpu']
    cpu = run_size_config['cpu']
    memory = run_size_config['memory']

    return count, cpu, memory, gpu

#
# Handler for creation of WorkerPool resource
#
# We use `./workerpool.sh` to invoke the `./workerpool/` helm chart
# which in turn creates the pod/job resources for the pool.
#
def create_workerpool(v1Api, customApi, application, run, namespace: str, uid: str, name: str, spec, queue_dataset: str, volumes, volumeMounts, envFroms, patch):
    try:
        api = application['spec']['api']
        if api != "workqueue":
            raise PermanentError(f"Failed to launch WorkerPool, due to unsupported api={api}.")

        image = application['spec']['image']
        command = application['spec']['command']

        # environment variables; merge application spec with workerpool spec
        env = application['spec']['env'] if 'env' in application['spec'] else {}
        if 'env' in spec:
            env.update(spec['env'])
        
        # where should we run the workers?
        # target = 'local' if 'local' in spec['target'] else 'kubernetes'
        kubecontext = ""
        kubeconfig = ""
        if 'target' in spec and 'kubernetes' in spec['target']:
            kubernetes = spec['target']['kubernetes']
            kubecontext = kubernetes['context']
            kubeconfig = kubernetes['config']['value'] if 'value' in kubernetes['config'] else ""
        
        run_id, workdir = alloc_run_id("workerpool", name)

        repo, workdir_pat_user_b64, workdir_pat_secret_b64, cm_data, cm_mount_path = clonev2(v1Api, customApi, application, namespace)
        subPath = ""

        count, cpu, memory, gpu = run_size(customApi, spec, application)
        logging.info(f"Sizeof WorkerPool name={name} namespace={namespace} count={count} cpu={cpu} memory={memory} gpu={gpu}")

        run_name = run["metadata"]["name"]
        application_name = application["metadata"]["name"]

        logging.info(f"About to call out to WorkerPool launcher for run={run_name} envFroms={envFroms} repo={repo}")
        try:
            out = subprocess.run([
                "./workerpool.sh",
                uid,
                name,
                namespace,
                f"{run_name}-{name.replace(application_name + '-', '')}"[:53].rstrip("-"), # name of worker pods/deployment = run_name-pool_name
                image,
                command,
                subPath,
                application_name, # part-of label
                run_name,
                queue_dataset,
                str(count),
                str(cpu),
                str(memory),
                str(gpu),
                kubecontext,
                kubeconfig,
                base64.b64encode(json.dumps(env).encode('ascii')),
                str(startup_delay_from_spec(spec["startupDelay"] if "startupDelay" in spec else "0")),
                base64.b64encode(json.dumps(volumes).encode('ascii')) if volumes is not None and len(volumes) > 0 else "",
                base64.b64encode(json.dumps(volumeMounts).encode('ascii')) if volumeMounts is not None and len(volumeMounts) > 0 else "",
                base64.b64encode(json.dumps(envFroms).encode('ascii')) if envFroms is not None and len(envFroms) > 0 else "",
                base64.b64encode(json.dumps(application['spec']['securityContext']).encode('ascii')) if 'securityContext' in application['spec'] else "",
                base64.b64encode(json.dumps(application['spec']['containerSecurityContext']).encode('ascii')) if 'containerSecurityContext' in application['spec'] else "",
                repo,
                workdir_pat_user_b64,
                workdir_pat_secret_b64,
                base64.b64encode(json.dumps(cm_data).encode('ascii')) if cm_data is not None else "",
                cm_mount_path if cm_mount_path is not None else "",
            ], capture_output=True)
            logging.info(f"WorkerPool callout done for name={name} with returncode={out.returncode}")
        except Exception as e:
            raise PermanentError(f"Failed to launch WorkerPool (1). {e}")

        if out.returncode != 0:
            raise PermanentError(f"Failed to launch WorkerPool (2). {out.stderr.decode('utf-8')}")
        else:
            #head_pod_name = out.stdout.decode('utf-8')
            #logging.info(f"Ray run head_pod_name={head_pod_name}")
            #return head_pod_name
            return ""

    except TemporaryError as te:
        # pass through any TemporaryErrors
        raise te
    except Exception as e:
        # set_status(name, namespace, 'Failed', patch)
        # set_status(name, namespace, "0", patch, "ready")
        # add_error_condition(customApi, name, namespace, str(e).strip(), patch)
        raise PermanentError(f"Failed to create WorkerPool name={name} namespace={namespace}. {str(e).strip()}")

# look for the Dataset instance that represents the queue for the given named Run
def find_queue_for_run(v1, run):
    run_name = run['metadata']['name']
    run_namespace = run['metadata']['namespace']

    if not 'annotations' in run['metadata'] or not 'jaas.dev/taskqueue' in run['metadata']['annotations']:
        raise TemporaryError(f"Run does not yet have an assigned task queue run={run_name} namespace={run_namespace}", delay=5)

    queue_dataset = run['metadata']['annotations']['jaas.dev/taskqueue']

    try:
        matching_dataset = v1.read_namespaced_secret(
            name=queue_dataset,
            namespace=run_namespace,
        )
        logging.info(f"Run does have an assigned task queue_dataset={queue_dataset} run={run_name} namespace={run_namespace}")
        return queue_dataset
    except ApiException as e:
        if e.status != 404:
            raise e
        else:
            raise TemporaryError(f"Run does have an assigned task queue, but it does not yet exist queue_dataset={queue_dataset} run={run_name} namespace={run_namespace}", delay=5)

def find_queue_for_run_by_name(v1Api, customApi, run_name: str, run_namespace: str):
    run = customApi.get_namespaced_custom_object(group="lunchpail.io", version="v1alpha1", plural="runs", name=run_name, namespace=run_namespace)
    return find_queue_for_run(v1Api, run)
    
# look for a default Dataset instance in the given namespace
def find_default_queue_for_namespace(v1Api, namespace: str):
    available_queues = v1Api.list_namespaced_secret(
        namespace=namespace,
        label_selector=f"app.kubernetes.io/component=taskqueue"
    )["items"]

    prioritized_queues = sorted(
        available_queues,
        key=lambda rsc: int(rsc['metadata']['annotations']['jaas.dev/priority']) if 'annotations' in rsc['metadata'] and 'jaas.dev/priority' in rsc['metadata']['annotations'] else 0
    )

    if len(prioritized_queues) == 0:
        return None
    else:
        return prioritized_queues[-1]
