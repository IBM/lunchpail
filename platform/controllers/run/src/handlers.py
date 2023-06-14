import kopf
import logging
from asyncio import create_task, shield

from kubernetes import client, config
from kubernetes.client.rest import ApiException

from logs import track_logs
from run_size import run_size

from ray import create_run_ray
from torch import create_run_torch

config.load_incluster_config()
v1Api = client.CoreV1Api()
customApi = client.CustomObjectsApi(client.ApiClient())

# A Run has been created.
@kopf.on.create('runs.codeflare.dev')
def create_run(name: str, namespace: str, uid: str, spec, patch, **kwargs):
    set_status(name, namespace, 'Pending', patch)

    application_name = spec['application']['name']
    application_namespace = spec['application']['namespace'] if 'namespace' in spec['application'] else namespace
    logging.info(f"Run for application={application_name} uid={uid}")

    try:
        application = customApi.get_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="applications", name=application_name, namespace=application_namespace)
    except ApiException as e:
        raise kopf.PermanentError(f"Application {application_name} not found. {str(e)}")

    run_size_config = run_size(customApi, spec, application)
    logging.info(f"Using run_size_config={str(run_size_config)}")

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
            head_pod_name = create_run_ray(v1Api, application, namespace, uid, name, spec, command_line_options, run_size_config, patch)
        elif api == "torch":
            head_pod_name = create_run_torch(v1Api, application, namespace, uid, name, spec, command_line_options, run_size_config, patch)
        else:
            raise kopf.PermanentError(f"Invalid API {api} for application={application_name}.")

        if head_pod_name is not None:
            shield(create_task(track_logs(v1Api, customApi, name, head_pod_name, namespace, api, patch)))

    except Exception as e:
        set_status(name, namespace, 'Failed', patch)
        raise kopf.PermanentError(f"Error handling run creation. {str(e)}")

# Update the status of a given named Run resource
def set_status(name: str, namespace: str, phase: str, patch):
    try:
        logging.info(f"Patching status name={name} phase={phase}")
        patch.metadata.annotations['codeflare.dev/status'] = phase
        # patch.status['phase'] = phase
        #body = [{"op": "replace", "path": "/status/phase", "value": phase}]
        #resp = customApi.patch_namespaced_custom_object_status(group="codeflare.dev", version="v1alpha1", plural="runs", name=name, namespace=namespace, body=body)
    except ApiException as e:
        raise kopf.PermanentError(f"Error patching Run status {str(e)}.")

# Watch each AppWrapper so that we can update the status of its associated Run
@kopf.on.field('appwrappers.mcad.ibm.com', field='status.conditions', labels={"app.kubernetes.io/managed-by": "codeflare.dev", "app.kubernetes.io/name": kopf.PRESENT})
def on_appwrapper_status_update(name: str, namespace: str, body, labels, **kwargs):
    conditions = body['status']['conditions']
    lastCondition = conditions[-1]
    run_name = labels["app.kubernetes.io/name"]
    phase = lastCondition['type'] if 'type' in lastCondition else 'Pending'
    patch_body = { "metadata": { "annotations": { "codeflare.dev/status": phase } } }
    logging.info(f"Handling managed AppWrapper update run_name={run_name} phase={phase}")
    try:
        resp = customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="runs", name=run_name, namespace=namespace, body=patch_body)
    except ApiException as e:
        raise kopf.PermanentError(f"Error patching Run on AppWrapper update run_name={run_name}. {str(e)}")

# Watch each managed Pod so that we can update the status of its associated Run
@kopf.on.field('pods', field='status.phase', labels={"app.kubernetes.io/managed-by": "codeflare.dev", "app.kubernetes.io/name": kopf.PRESENT, "app.kubernetes.io/part-of": kopf.PRESENT})
def on_pod_status_update(name: str, namespace: str, body, labels, **kwargs):
    phase = body['status']['phase']
    run_name = labels["app.kubernetes.io/part-of"]
    patch_body = { "metadata": { "annotations": { "codeflare.dev/status": phase } } }
    logging.info(f"Handling managed Pod update run_name={run_name} phase={phase}")
    try:
        resp = customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="runs", name=run_name, namespace=namespace, body=patch_body)
    except ApiException as e:
        raise kopf.PermanentError(f"Error patching Run on Pod update run_name={run_name}. {str(e)}")

# Watch each managed Pod for deletion
@kopf.on.delete('pods', labels={"app.kubernetes.io/managed-by": "codeflare.dev", "app.kubernetes.io/name": kopf.PRESENT, "app.kubernetes.io/part-of": kopf.PRESENT})
def on_pod_delete(name: str, namespace: str, body, labels, **kwargs):
    raw_phase = body['status']['phase']
    phase = "Offline" if raw_phase == "Running" else raw_phase

    run_name = labels["app.kubernetes.io/part-of"]
    patch_body = { "metadata": { "annotations": { "codeflare.dev/status": phase } } }
    logging.info(f"Handling managed Pod delete run_name={run_name} phase={phase}")
    try:
        resp = customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="runs", name=run_name, namespace=namespace, body=patch_body)
    except ApiException as e:
        logging.error(f"Error patching Run on Pod delete run_name={run_name}. {str(e)}")
