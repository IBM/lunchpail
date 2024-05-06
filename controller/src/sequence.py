import base64
import logging
import subprocess
from typing import List
from kopf import PermanentError
from kubernetes.client.rest import ApiException

from run_id import alloc_run_id

def fetch(application_name: str, application_namespace: str, customApi):
    return customApi.get_namespaced_custom_object(group="lunchpail.io", version="v1alpha1", plural="applications", name=application_name, namespace=application_namespace)

# TODO parallelize the fetches
# TODO fetch application from different namespace? (requires crd update)
def fetch_all(application_names: List[str], application_namespace: str, customApi):
    return map(lambda application_name: fetch(application_name, application_namespace, customApi), application_names)

def create_run_sequence(v1Api, customApi, application, namespace: str, uid: str, name: str, part_of: str, step: str, spec, command_line_options, run_size_config, volumes, volumeMounts, envFroms, patch):
    application_name = spec['application']['name']
    logging.info(f"Handling Sequence Run: app={application_name} run={name} part_of={part_of} step={step}")

    run_id, workdir = alloc_run_id("seq", name)
    application_names = application['spec']['steps']

    try:
        #applications = fetch_all(application_names, namespace, customApi) # for now, just verify they exist

        args = [
            "./sequence.sh",
            uid,
            name,
            namespace,
            part_of,
            step,
            run_id,
            str(len(application_names)),
            base64.b64encode(",".join(application_names).encode('ascii'))
        ]

        out = subprocess.run(args, capture_output=True)
        logging.info(f"fired off sequence rc={out.returncode} name={name} namespace={namespace}")
    except ApiException as e:
        raise PermanentError(f"Failed to launch sequence. {out.stderr.decode('utf-8')}")

    if out.returncode != 0:
        raise PermanentError(f"Failed to launch sequence. {out.stderr.decode('utf-8')}")
    else:
        head_pod_name = out.stdout.decode('utf-8')
        if len(head_pod_name) > 0:
            logging.info(f"Sequence run head_pod_name={head_pod_name}")
            return head_pod_name
