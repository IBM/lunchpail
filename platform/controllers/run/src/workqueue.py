import base64
import logging
import subprocess
from kopf import PermanentError
from kubernetes.client.rest import ApiException

from run_id import alloc_run_id

def create_run_workqueue(v1Api, customApi, application, namespace: str, uid: str, name: str, part_of: str, step: str, spec, command_line_options, run_size_config, dataset_labels: str, dataset: str, patch):
    application_name = spec['application']['name']
    logging.info(f"Handling WorkQueue Run: app={application_name} run={name} dataset_labels={dataset_labels}")

    run_id, workdir = alloc_run_id("workqueue", name)

    logging.info(f"About to call out to WorkQueue run_id={run_id}")
    try:
        workqueue_out = subprocess.run([
            "/src/workqueue.sh",
            uid,
            name,
            namespace,
            part_of,
            run_id,
            dataset,
            base64.b64encode(dataset_labels.encode('ascii')) if dataset_labels is not None else ""
        ], capture_output=True)
        logging.info(f"WorkQueue callout done for name={name} with returncode={workqueue_out.returncode}")
    except Exception as e:
        raise PermanentError(f"Failed to launch via WorkQueue. {e}")

    if workqueue_out.returncode != 0:
        raise PermanentError(f"Failed to launch WorkQueue. {workqueue_out.stderr.decode('utf-8')}")
