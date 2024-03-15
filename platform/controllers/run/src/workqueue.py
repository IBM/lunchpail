import re
import base64
import logging
import subprocess
from typing import List
from kopf import PermanentError
from kubernetes.client.rest import ApiException

from datasets import add_dataset
from workerpool import find_default_queue_for_namespace

#
# Handler for creation of Run with Application@api=workqueue
#
# We use `./workqueue.sh` which in turn uses the `./workqueue/` helm
# chart to create the WorkStealer for this Run.
#
def create_run_workqueue(v1Api, customApi, application, namespace: str, uid: str, name: str, part_of: str, step: str, spec, command_line_options, run_size_config, dataset_labels_arr: List[str], volumes, volumeMounts, patch):
    application_name = spec['application']['name']
    logging.info(f"Handling WorkQueue Run: app={application_name} run={name}")

    logging.info(f"About to call out to WorkQueue run={name}")
    try:
        # if spec.queue is provided, use that specified queue,
        # otherwise create a new one
        if 'queue' in spec:
            queue_dataset = spec['queue']['dataset']['name']
            create_queue = False
            logging.info(f"Queue for workqueue Run: using queue from Run spec queue={queue_dataset} for run={name} namespace={namespace}")
        else:
            queue_dataset_resource = find_default_queue_for_namespace(customApi, namespace)
            if queue_dataset_resource is None:
                queue_dataset = re.sub("-", "", name)
                create_queue = True
                logging.info(f"Queue for workqueue Run: creating queue={queue_dataset} for run={name} namespace={namespace}")
            else:
                queue_dataset = queue_dataset_resource['metadata']['name']
                create_queue = False
                logging.info(f"Queue for workqueue Run: using discovered queue={queue_dataset} for run={name} namespace={namespace}")

        patch.metadata.annotations["jaas.dev/taskqueue"] = queue_dataset
        dataset_labels = add_dataset(queue_dataset, "configmap", [])
        # ^^^^ Important: [] not dataset_labels_arr; we don't want to
        # pass all of the Application datasets to the WorkStealer,
        # only the queue_dataset
        
        workqueue_out = subprocess.run([
            "./workqueue.sh",
            uid,
            name,
            namespace,
            part_of,
            spec["inbox"] if "inbox" in spec else "",
            queue_dataset,
            str(create_queue).lower(), # true or false, downcasing to make compatible with helm booleans
            base64.b64encode(dataset_labels.encode('ascii')) if dataset_labels is not None else ""
        ], capture_output=True)
        logging.info(f"WorkQueue callout done for name={name} with returncode={workqueue_out.returncode}")
    except Exception as e:
        raise PermanentError(f"Failed to launch via WorkQueue. {e}")

    if workqueue_out.returncode != 0:
        raise PermanentError(f"Failed to launch WorkQueue. {workqueue_out.stderr.decode('utf-8')}")
