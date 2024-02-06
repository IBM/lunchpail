import re
import base64
import logging
import subprocess
from typing import List
from kopf import PermanentError
from kubernetes.client.rest import ApiException

from run_id import alloc_run_id
from datasets import add_dataset

#
# Handler for creation of Run with Application@api=workqueue
#
# We use `./workqueue.sh` which in turn uses the `./workqueue/` helm
# chart to create the WorkStealer for this Run.
#
def create_run_workqueue(v1Api, customApi, application, namespace: str, uid: str, name: str, part_of: str, step: str, spec, command_line_options, run_size_config, dataset_labels_arr: List[str], patch):
    application_name = spec['application']['name']
    logging.info(f"Handling WorkQueue Run: app={application_name} run={name}")

    run_id, workdir = alloc_run_id("workqueue", name)

    logging.info(f"About to call out to WorkQueue run_id={run_id}")
    try:
        queue_dataset = re.sub("-", "", name)
        dataset_labels = add_dataset(queue_dataset, "mount", dataset_labels_arr)
        
        workqueue_out = subprocess.run([
            "/src/workqueue.sh",
            uid,
            name,
            namespace,
            part_of,
            run_id,
            spec["inbox"] if "inbox" in spec else "",
            queue_dataset,
            base64.b64encode(dataset_labels.encode('ascii')) if dataset_labels is not None else ""
        ], capture_output=True)
        logging.info(f"WorkQueue callout done for name={name} with returncode={workqueue_out.returncode}")
    except Exception as e:
        raise PermanentError(f"Failed to launch via WorkQueue. {e}")

    if workqueue_out.returncode != 0:
        raise PermanentError(f"Failed to launch WorkQueue. {workqueue_out.stderr.decode('utf-8')}")
