import os
import json
import base64
import logging
import traceback
import subprocess

from functools import partial
from kopf import PermanentError, TemporaryError

from clone import clone
from status import set_status, add_error_condition, set_status_after_clone_failure
from run_id import alloc_run_id
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
def create_workerpool(v1Api, customApi, application, namespace: str, uid: str, name: str, spec, queue_dataset: str, dataset_labels, volumes, volumeMounts, patch):
    try:
        api = application['spec']['api']
        if api != "workqueue":
            raise PermanentError(f"Failed to launch WorkerPool, due to unsupported api={api}.")

        image = application['spec']['image']
        command = application['spec']['command']

        run_name = spec['run']

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

        try:
            cloned_subPath = clone(v1Api, customApi, application, name, namespace, workdir)
        except Exception as e:
            set_status_after_clone_failure(customApi, name, namespace, e, patch)

        subPath = os.path.join(run_id, cloned_subPath)

        count, cpu, memory, gpu = run_size(customApi, spec, application)
        logging.info(f"Sizeof WorkerPool name={name} namespace={namespace} count={count} cpu={cpu} memory={memory} gpu={gpu}")

        logging.info(f"About to call out to WorkerPool launcher")
        try:
            out = subprocess.run([
                "./workerpool.sh",
                uid,
                name,
                namespace,
                f"{name}-workers", # name of worker pods/deployment
                image,
                command,
                subPath,
                run_name,
                queue_dataset,
                str(count),
                str(cpu),
                str(memory),
                str(gpu),
                base64.b64encode(dataset_labels.encode('ascii')) if dataset_labels is not None else "",
                kubecontext,
                kubeconfig,
                base64.b64encode(json.dumps(env).encode('ascii')),
                str(startup_delay_from_spec(spec["startupDelay"] if "startupDelay" in spec else "0")),
                base64.b64encode(json.dumps(volumes).encode('ascii')) if volumes is not None and len(volumes) > 0 else "",
                base64.b64encode(json.dumps(volumeMounts).encode('ascii')) if volumeMounts is not None and len(volumeMounts) > 0 else "",
                base64.b64encode(json.dumps(application['spec']['securityContext']).encode('ascii')) if 'securityContext' in application['spec'] else "",
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
        set_status(name, namespace, 'Failed', patch)
        set_status(name, namespace, "0", patch, "ready")
        add_error_condition(customApi, name, namespace, str(e).strip(), patch)
        raise PermanentError(f"Failed to create WorkerPool name={name} namespace={namespace}. {str(e).strip()}")

# A pod that is part of a WorkerPool has been created. We now create a
# Queue resource to help with accounting.
def on_worker_pod_create(v1Api, customApi, pod_name: str, namespace: str, pod_uid: str, annotations, labels, spec, patch):
    logging.info(f"Handling WorkerPool pod creation pod_name={pod_name} namespace={namespace}")
    pool_name = labels["app.kubernetes.io/name"]
    pool = customApi.get_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="workerpools", name=pool_name, namespace=namespace)

    run_name = pool["spec"]["run"]

    queue_dataset = find_queue_for_run_by_name(customApi, run_name, namespace)
    if queue_dataset is None:
        # TODO report this somehow via some resource status
        logging.error(f"Missing queue dataset for worker run_name={run_name} pod_name={pod_name} namespace={namespace}")
        return

    worker_index = annotations["batch.kubernetes.io/job-completion-index"]
    queue_name = f"{run_name}-{pool_name}-{worker_index}"

    body = {
        "apiVersion": "codeflare.dev/v1alpha1",
        "kind": "Queue",
        "metadata": {
            "name": queue_name,
            "annotations": {
                "codeflare.dev/inbox": "0",
                "codeflare.dev/processing": "0",
                "codeflare.dev/outbox": "0"
            },
            "labels": {
                "codeflare.dev/pod": pod_name,
                "codeflare.dev/worker-index": worker_index,
                "app.kubernetes.io/name": pool_name,
                "app.kubernetes.io/part-of": run_name,
                "app.kubernetes.io/managed-by": "codeflare.dev",
                "app.kubernetes.io/component": "queue"
            },
            "ownerReferences": [{
                "apiVersion": "v1",
                "kind": "Pod",
                "controller": True,
                "name": pod_name,
                "uid": pod_uid,
            }]
        },
        "spec": {
            "dataset": queue_dataset
        }
    }
    customApi.create_namespaced_custom_object("codeflare.dev", "v1alpha1", namespace, "queues", body)
    patch.metadata.labels["codeflare.dev/queue"] = queue_name

# e.g. codeflare.dev queue 0 inbox 30
import re
def look_for_queue_updates(line: str):
    logging.info(f"Queue update {line}")
    m = re.search("^lunchpail.io queue (\d+) (\w+) (\d+)$", line)
    if m is not None:
        worker_idx = m.group(1)
        box_name = m.group(2)
        queue_depth = m.group(3)

        patch_body = { "metadata": { "annotations": { f"codeflare.dev/{box_name}": queue_depth } } }
        return patch_body

from logs import track_logs
def track_queue_logs(pod_name: str, namespace: str, labels):
    try:
        if 'codeflare.dev/queue' in labels:
            queue_name = labels['codeflare.dev/queue']
            logging.info(f"Setting up queue log watcher queue_name={queue_name} pod_name={pod_name} namespace={namespace}")

            try:
                # intentionally fire and forget (how bad is this?)
                track_logs(queue_name, pod_name, namespace, "queues", look_for_queue_updates, "syncer")
            except Exception as e:
                logging.error(f"Error setting up log watcher queue_name={queue_name} pod_name={pod_name} namespace={namespace}. {str(e)}")
        else:
            logging.info(f"Skipping queue log watcher due to missing queue_name pod_name={pod_name} namespace={namespace}")
    except Exception as e:
        logging.error(f"Error log watcher WorkerPool pod for queue stats pod_name={pod_name} namespace={namespace}. {str(e)}")
            
# e.g. codeflare.dev queue 0 inbox 30
def look_for_workstealer_updates(context_name: str, run_namespace: str, run_name: str, line: str):
    # logging.info(f"Workstealer update {line}")
    m = re.search("^lunchpail.io (done|unassigned) (\d+)$", line)
    if m is not None:
        state = m.group(1) # done or unassigned
        count = m.group(2) # how many are done, or how many are unassigned

        patch_body = { "metadata": { "annotations": { f"jaas.dev/{state}.{context_name}.{run_namespace}.{run_name}": count } } }
        return patch_body

# look for the Dataset instance that represents the queue for the given named Run
def find_queue_for_run(customApi, run):
    run_name = run['metadata']['name']
    run_namespace = run['metadata']['namespace']

    if not 'annotations' in run['metadata'] or not 'jaas.dev/taskqueue' in run['metadata']['annotations']:
        raise TemporaryError(f"Run does not yet have an assigned task queue run={run_name} namespace={run_namespace}", delay=5)

    queue_dataset = run['metadata']['annotations']['jaas.dev/taskqueue']

    matching_dataset = customApi.get_namespaced_custom_object(
        group="com.ie.ibm.hpsys",
        version="v1alpha1",
        plural="datasets",
        name=queue_dataset,
        namespace=run_namespace,
    )

    if matching_dataset is None:
        raise TemporaryError(f"Run does yet have an assigned task, but it does not yet exist queue_dataset={queue_dataset} run={run_name} namespace={run_namespace}", delay=5)
    else:
        logging.info(f"Run does have an assigned task queue_dataset={queue_dataset} run={run_name} namespace={run_namespace}")
        return queue_dataset

def find_queue_for_run_by_name(customApi, run_name: str, run_namespace: str):
    run = customApi.get_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="runs", name=run_name, namespace=run_namespace)
    return find_queue_for_run(customApi, run)
    
# look for a default Dataset instance in the given namespace
def find_default_queue_for_namespace(customApi, namespace: str):
    available_queues = customApi.list_namespaced_custom_object(
        group="com.ie.ibm.hpsys",
        version="v1alpha1",
        plural="datasets",
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

def track_workstealer_logs(customApi, pod_name: str, namespace: str, labels):
    try:
        logging.info(f"Considering workstealer log watcher (1) pod_name={pod_name} namespace={namespace}")
        run_name = labels["app.kubernetes.io/part-of"]
        dataset_name = find_queue_for_run_by_name(customApi, run_name, namespace)
        logging.info(f"Considering workstealer log watcher (2) pod_name={pod_name} namespace={namespace} run_name={run_name} dataset_name={dataset_name}")

        context_name = os.getenv("CONTROL_PLANE_CONTEXT")
        if context_name is None:
            raise PermanentError("CONTROL_PLANE_CONTEXT environment variable is not defined")

        log_line_handler = partial(look_for_workstealer_updates, context_name, namespace, run_name)

        if dataset_name:
            try:
                dgroup = "com.ie.ibm.hpsys"
                version = "v1alpha1"
                plural = "datasets"

                patch_body = { "metadata": { "annotations": { f"jaas.dev/unassigned.{context_name}.{namespace}.{run_name}": "0" } } }
                logging.info(f"Patching dataset for workstealer operation dataset_name={dataset_name} pod_name={pod_name} namespace={namespace}")
                customApi.patch_namespaced_custom_object(group=dgroup, version=version, plural=plural, name=dataset_name, namespace=namespace, body=patch_body)

                # intentionally fire and forget (how bad is this?)
                logging.info(f"Setting up workstealer log watcher dataset_name={dataset_name} pod_name={pod_name} namespace={namespace}")
                track_logs(dataset_name, pod_name, namespace, plural, log_line_handler, None, dgroup, version)
            except Exception as e:
                logging.error(f"Error setting up log watcher dataset_name={dataset_name} pod_name={pod_name} namespace={namespace}. {str(e)}")
                traceback.print_exc()
        else:
            logging.info(f"Skipping workstealer log watcher due to missing queue pod_name={pod_name} namespace={namespace} run_name={run_name} dataset_name={dataset_name}")
    except TemporaryError as e:
        raise e
    except Exception as e:
        logging.error(f"Error workstealer log watcherpod_name={pod_name} namespace={namespace}. {str(e)}")
        traceback.print_exc()
