import logging
from kopf import PermanentError
from kubernetes.client.rest import ApiException

from run_id import alloc_run_id

def create_run_workqueue(v1Api, customApi, application, namespace: str, uid: str, name: str, part_of: str, step: str, spec, command_line_options, run_size_config, dataset_labels, patch):
    application_name = spec['application']['name']
    logging.info(f"Handling WorkQueue Run: app={application_name} run={name} part_of={part_of} step={step}")

    run_id, workdir = alloc_run_id("workq", name)
