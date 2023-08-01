import kopf
import logging

from kubernetes import client, config
from kubernetes.client.rest import ApiException

from logs import track_logs
from run_size import run_size
from datasets import prepare_dataset_labels

from shell import create_run_shell
from ray import create_run_ray
from torch import create_run_torch
from spark import create_run_spark
from kubeflow import create_run_kubeflow
from sequence import create_run_sequence

config.load_incluster_config()
v1Api = client.CoreV1Api()
customApi = client.CustomObjectsApi(client.ApiClient())

# A Run has been created.
@kopf.on.create('runs.codeflare.dev')
def create_run(name: str, namespace: str, uid: str, labels, spec, patch, **kwargs):
    set_status(name, namespace, 'Pending', patch)

    # what top-level run is this part of? this could be this very run,
    # if it is a top-level run...
    # also, if part of a sequence, which step are we?
    part_of = labels['app.kubernetes.io/part-of'] if 'app.kubernetes.io/part-of' in labels else name
    step = labels['app.kubernetes.io/step'] if 'app.kubernetes.io/step' in labels else '0'

    application_name = spec['application']['name']
    application_namespace = spec['application']['namespace'] if 'namespace' in spec['application'] else namespace
    logging.info(f"Run for application={application_name} application_namespace={application_namespace} run_uid={uid}")

    try:
        application = customApi.get_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="applications", name=application_name, namespace=application_namespace)
    except ApiException as e:
        set_status(name, namespace, 'Failed', patch)
        raise kopf.PermanentError(f"Application {application_name} not found. {str(e)}")

    run_size_config = run_size(customApi, name, spec, application)
    logging.info(f"Using name={name} run_size_config={str(run_size_config)}")

    if 'options' in spec:
        command_line_options = spec['options']
    elif 'options' in application['spec']:
        command_line_options = application['spec']['options']
    else:
        command_line_options = ""

    dataset_labels = prepare_dataset_labels(customApi, name, namespace, spec, application)
    if dataset_labels is not None:
        logging.info(f"Attaching datasets run={name} datasets={dataset_labels}")

    try:
        api = application['spec']['api']
        logging.info(f"Found application={application_name} api={api} ns={application_namespace}")

        if api == "ray":
            head_pod_name = create_run_ray(v1Api, customApi, application, namespace, uid, name, part_of, step, spec, command_line_options, run_size_config, dataset_labels, patch)
        elif api == "torch":
            head_pod_name = create_run_torch(v1Api, customApi, application, namespace, uid, name, part_of, step, spec, command_line_options, run_size_config, dataset_labels, patch)
        elif api == "spark":
            head_pod_name = create_run_spark(v1Api, customApi, application, namespace, uid, name, part_of, step, spec, command_line_options, run_size_config, dataset_labels, patch)            
        elif api == "shell":
            head_pod_name = create_run_shell(v1Api, customApi, application, namespace, uid, name, part_of, step, spec, command_line_options, run_size_config, dataset_labels, patch)
        elif api == "kubeflow":
            head_pod_name = create_run_kubeflow(v1Api, customApi, application, namespace, uid, name, part_of, step, spec, command_line_options, run_size_config, dataset_labels, patch)            
        elif api == "sequence":
            head_pod_name = create_run_sequence(v1Api, customApi, application, namespace, uid, name, part_of, step, spec, command_line_options, run_size_config, dataset_labels, patch)            
        else:
            raise kopf.PermanentError(f"Invalid API {api} for application={application_name}.")

        if head_pod_name is not None and len(head_pod_name) > 0:
            track_logs(v1Api, customApi, name, head_pod_name, namespace, api, patch)

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
        customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="runs", name=run_name, namespace=namespace, body=patch_body)
    except ApiException as e:
        logging.error(f"Error patching Run on AppWrapper update run_name={run_name}. {str(e)}")

# Watch each managed Pod so that we can update the status of its associated Run
@kopf.on.field('pods', field='status.phase', labels={"app.kubernetes.io/managed-by": "codeflare.dev", "app.kubernetes.io/name": kopf.PRESENT, "app.kubernetes.io/part-of": kopf.PRESENT})
def on_pod_status_update(name: str, namespace: str, body, labels, **kwargs):
    phase = body['status']['phase']
    run_name = labels["app.kubernetes.io/part-of"]
    patch_body = { "metadata": { "annotations": { "codeflare.dev/status": phase } } }
    logging.info(f"Handling managed Pod update run_name={run_name} phase={phase}")
    try:
        customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="runs", name=run_name, namespace=namespace, body=patch_body)
    except ApiException as e:
        logging.error(f"Error patching Run on Pod update run_name={run_name}. {str(e)}")

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

# Watch pod events so we can capture pod scheduling, image pull, etc. status updates and associate them with a Run
@kopf.on.create('events', field="involvedObject.kind", value="Pod")
@kopf.on.update('events', field="involvedObject.kind", value="Pod")
def on_pod_event(name: str, namespace: str, body, **kwargs):
    try:
        if "reason" in body and "component" in body["source"] and body["source"]["component"] != "kopf":
            pod_name = body["involvedObject"]["name"]
            logging.info(f"Pod event for pod_name={pod_name} {body}")
            pod = v1Api.read_namespaced_pod(pod_name, namespace)
            pod_labels = pod.metadata.labels
            if "app.kubernetes.io/managed-by" in pod_labels and pod_labels["app.kubernetes.io/managed-by"] == "codeflare.dev" and "app.kubernetes.io/part-of" in pod_labels:
                phase = body["reason"]
                run_name = pod_labels["app.kubernetes.io/part-of"]
                logging.info(f"Pod event for run_name={run_name} phase={phase} {body}")

                patch_body = { "metadata": { "annotations": { "codeflare.dev/status": phase } } }
                try:
                    customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="runs", name=run_name, namespace=namespace, body=patch_body)
                except ApiException as e:
                    logging.error(f"Error patching Run on pod event run_name={run_name} phase={phase}. {str(e)}")
        else:
            logging.info(f"Dropping event {body}")

    except Exception as e:
        logging.error(f"Error handling pod event name={name} namespace={namespace}. {e}")
