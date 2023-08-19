import os
import base64
import logging
import subprocess
from kopf import PermanentError

from clone import clone
from status import set_status
from run_id import alloc_run_id
from run_size import load_run_size_config

def run_size(customApi, spec):
    count = spec['workers']['count']
    size = spec['workers']['size']
    supportsGpu = spec['workers']['supportsGpu'] if 'supportsGpu' in spec['workers'] else False

    logging.info(f"Loading WorkerPool run_size config size={size}")
    run_size_config = load_run_size_config(customApi, size)
    logging.info(f"Loaded WorkerPool run_size config size={size} config={run_size_config}")

    if not supportsGpu:
        run_size_config['gpu'] = 0

    gpu = run_size_config['gpu']
    cpu = run_size_config['cpu']
    memory = run_size_config['memory']

    return count, cpu, memory, gpu

def create_workerpool(v1Api, customApi, application, namespace: str, uid: str, name: str, spec, dataset_labels, patch):
    try:
        set_status(name, namespace, 'Pending', patch)
        set_status(name, namespace, "0", patch, "ready")

        api = application['spec']['api']
        if api != "workqueue":
            raise PermanentError(f"Failed to launch WorkerPool, due to unsupported api={api}.")

        image = application['spec']['image']
        command = application['spec']['command']

        application_name = spec['application']['name']
        application_namespace = spec['application']['namespace'] if 'namespace' in spec['application'] else namespace
        logging.info(f"Creating WorkerPool name={name} namespace={namespace} for application={application_name} uid={uid}")

        run_id, workdir = alloc_run_id("workerpool", name)
        cloned_subPath = clone(v1Api, customApi, application, name, workdir)
        subPath = os.path.join(run_id, cloned_subPath)

        count, cpu, memory, gpu = run_size(customApi, spec)
        logging.info(f"Sizeof WorkerPool name={name} namespace={namespace} count={count} cpu={cpu} memory={memory} gpu={gpu}")

        logging.info(f"About to call out to WorkerPool launcher")
        try:
            out = subprocess.run([
                "/src/workerpool.sh",
                uid,
                name,
                namespace,
                run_id,
                image,
                command,
                subPath,
                application_name,
                spec['dataset'],
                str(count),
                str(cpu),
                str(memory),
                str(gpu),
                base64.b64encode(dataset_labels.encode('ascii')) if dataset_labels is not None else "",
            ], capture_output=True)
            logging.info(f"WorkerPool callout done for name={name} with returncode={out.returncode}")
        except Exception as e:
            raise PermanentError(f"Failed to launch WorkerPool. {e}")

        if out.returncode != 0:
            raise PermanentError(f"Failed to launch WorkerPool. {out.stderr.decode('utf-8')}")
        else:
            #head_pod_name = out.stdout.decode('utf-8')
            #logging.info(f"Ray run head_pod_name={head_pod_name}")
            #return head_pod_name
            return ""

    except Exception as e:
        set_status(name, namespace, 'Failed', patch)
        set_status(name, namespace, "0", patch, "ready")
        raise PermanentError(f"Failed to create WorkerPool name={name} namespace={namespace}. {e}")

# A pod that is part of a WorkerPool has been created. We now create a
# Queue resource to help with accounting.
def on_worker_pod_create(v1Api, customApi, pod_name: str, namespace: str, annotations, labels, spec, patch):
    logging.info(f"Handling WorkerPool pod creation pod_name={pod_name} namespace={namespace}")
    pool_name = labels["app.kubernetes.io/name"]
    pool = customApi.get_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="workerpools", name=pool_name, namespace=namespace)

    app_name = pool["spec"]["application"]["name"]
    dataset_name = pool["spec"]["dataset"]
    worker_index = annotations["batch.kubernetes.io/job-completion-index"]
    queue_name = f"queue-{app_name}-{dataset_name}-{worker_index}"

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
                "app.kubernetes.io/name": pool_name,
                "app.kubernetes.io/part-of": app_name,
                "app.kubernetes.io/managed-by": "codeflare.dev",
                "app.kubernetes.io/component": "queue"
            }
        },
        "spec": {
            "dataset": dataset_name
        }
    }
    customApi.create_namespaced_custom_object("codeflare.dev", "v1alpha1", namespace, "queues", body)
    patch.metadata.labels["codeflare.dev/queue"] = queue_name

# e.g. codeflare.dev queue 0 inbox 30
import re
def look_for_queue_updates(line: str):
    logging.info(f"Queue update {line}")
    m = re.search("^codeflare.dev queue (\d+) (\w+) (\d+)$", line)
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
            logging.info(f"Setting up queue tracking queue_name={queue_name} pod_name={pod_name} namespace={namespace}")

            try:
                # intentionally fire and forget (how bad is this?)
                track_logs(queue_name, pod_name, namespace, "queues", look_for_queue_updates, "syncer")
            except Exception as e:
                logging.error(f"Error setting up log tracking queue_name={queue_name} pod_name={pod_name} namespace={namespace}. {str(e)}")
        else:
            logging.info(f"Skipping queue tracking due to missing queue_name pod_name={pod_name} namespace={namespace}")
    except Exception as e:
        logging.error(f"Error tracking WorkerPool pod for queue stats pod_name={pod_name} namespace={namespace}. {str(e)}")
            
# e.g. codeflare.dev queue 0 inbox 30
def look_for_workstealer_updates(line: str):
    logging.info(f"Workstealer update {line}")
    m = re.search("^codeflare.dev unassigned (\d+)$", line)
    if m is not None:
        num_unassigned = m.group(1)

        patch_body = { "metadata": { "annotations": { f"codeflare.dev/unassigned": num_unassigned } } }
        return patch_body

def track_workstealer_logs(pod_name: str, namespace: str, labels):
    try:
        if 'dataset.0.id' in labels:
            dataset_name = labels['dataset.0.id']
            logging.info(f"Setting up workstealer tracking dataset_name={dataset_name} pod_name={pod_name} namespace={namespace}")

            try:
                # intentionally fire and forget (how bad is this?)
                track_logs(dataset_name, pod_name, namespace, "datasets", look_for_workstealer_updates, None, "com.ie.ibm.hpsys", "v1alpha1")
            except Exception as e:
                logging.error(f"Error setting up log tracking dataset_name={dataset_name} pod_name={pod_name} namespace={namespace}. {str(e)}")
        else:
            logging.info(f"Skipping workstealer tracking due to missing dataset_name pod_name={pod_name} namespace={namespace}")
    except Exception as e:
        logging.error(f"Error tracking WorkerPool pod for workstealer stats pod_name={pod_name} namespace={namespace}. {str(e)}")
