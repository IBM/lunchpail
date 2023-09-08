import kopf
import logging

from kubernetes import client, config
from kubernetes.client.rest import ApiException

from logs import track_job_logs
from status import set_status, set_status_immediately, add_error_condition
from run_size import run_size
from datasets import prepare_dataset_labels, prepare_dataset_labels_for_workerpool

from shell import create_run_shell
from ray import create_run_ray
from torch import create_run_torch
from spark import create_run_spark
from kubeflow import create_run_kubeflow
from sequence import create_run_sequence
from workqueue import create_run_workqueue

from workerpool import create_workerpool, on_worker_pod_create, track_queue_logs, track_workstealer_logs

config.load_incluster_config()
v1Api = client.CoreV1Api()
customApi = client.CustomObjectsApi(client.ApiClient())

# A WorkerPool has been created.
@kopf.on.create('workerpools.codeflare.dev')
def create_workerpool_kopf(name: str, namespace: str, uid: str, labels, spec, patch, **kwargs):
    try:
        application_name = spec['application']['name']
        application_namespace = spec['application']['namespace'] if 'namespace' in spec['application'] else namespace
        logging.info(f"WorkerPool creation for application={application_name} uid={uid}")

        try:
            application = customApi.get_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="applications", name=application_name, namespace=application_namespace)
        except ApiException as e:
            set_status(name, namespace, 'Failed', patch)
            raise kopf.PermanentError(f"Application {application_name} not found. {str(e)}")

        dataset_labels = [] # prepare_dataset_labels(customApi, name, namespace, spec, application)
        dataset_labels = prepare_dataset_labels_for_workerpool(customApi, spec['dataset'], namespace, dataset_labels)

        if dataset_labels is not None:
            logging.info(f"Attaching datasets run={name} datasets={dataset_labels}")

        # initial ready count
        patch.metadata['codeflare.dev/ready'] = '0'

        create_workerpool(v1Api, customApi, application, namespace, uid, name, spec, dataset_labels, patch)
    except Exception as e:
        set_status(name, namespace, 'Failed', patch)
        # add_error_condition_to_run(customApi, name, namespace, str(e).strip(), patch)
        raise kopf.PermanentError(f"Error handling run creation. {str(e)}")

# A Run has been created.
@kopf.on.create('runs.codeflare.dev')
def create_run(name: str, namespace: str, uid: str, labels, spec, patch, **kwargs):
    try:
        set_status_immediately(customApi, name, namespace, 'Pending')

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

        datasets, dataset_labels = prepare_dataset_labels(customApi, name, namespace, spec, application)
        if dataset_labels is not None:
            logging.info(f"Attaching datasets run={name} datasets={dataset_labels}")

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
        elif api == "workqueue":
            if len(datasets) == 0:
                raise kopf.PermanentError("Queue Dataset not defined")
            else:
                head_pod_name = create_run_workqueue(v1Api, customApi, application, namespace, uid, name, part_of, step, spec, command_line_options, run_size_config, dataset_labels, datasets[0], patch)
        else:
            raise kopf.PermanentError(f"Invalid API {api} for application={application_name}.")

        if head_pod_name is not None and len(head_pod_name) > 0:
            track_job_logs(name, head_pod_name, namespace, api)

    except Exception as e:
        set_status(name, namespace, 'Failed', patch)
        add_error_condition(customApi, name, namespace, str(e).strip(), patch)
        raise kopf.PermanentError(f"Error handling run creation. {str(e)}")

def plural(component: str):
    if component == "workerpool":
        return "workerpools"
    else:
        return "runs"

def component(labels):
    return labels["app.kubernetes.io/component"] if "app.kubernetes.io/component" in labels else ""

# Watch each AppWrapper so that we can update the status of its associated Run
@kopf.on.field('appwrappers.mcad.ibm.com', field='status.conditions', labels={"app.kubernetes.io/managed-by": "codeflare.dev", "app.kubernetes.io/name": kopf.PRESENT})
def on_appwrapper_status_update(name: str, namespace: str, body, labels, **kwargs):
    try:
        conditions = body['status']['conditions']
        lastCondition = conditions[-1]
        component_name = labels["app.kubernetes.io/name"]
        phase = lastCondition['type'] if 'type' in lastCondition else 'Pending'
        message = lastCondition['reason'] if 'reason' in lastCondition else ""
        patch_body = { "metadata": { "annotations": { "codeflare.dev/status": phase, "codeflare.dev/message": message } } }
        logging.info(f"Handling managed AppWrapper update component_name={component_name} phase={phase}")

        customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural=plural(component(labels)), name=component_name, namespace=namespace, body=patch_body)
    except Exception as e:
        logging.error(f"Error patching Run on AppWrapper update name={name} namespace={namespace}. {str(e)}")

# Watch each managed Pod so that we can update the status of its associated Run
@kopf.on.field('pods', field='status.phase', labels={"app.kubernetes.io/managed-by": "codeflare.dev", "app.kubernetes.io/name": kopf.PRESENT, "app.kubernetes.io/part-of": kopf.PRESENT})
def on_pod_status_update(name: str, namespace: str, body, labels, **kwargs):
    try:
        phase = body['status']['phase']

        if component(labels) == "workstealer":
            if phase == "Running":
                try:
                    track_workstealer_logs(customApi, name, namespace, labels)
                except Exception as e:
                    logging.error(f"Error tracking WorkStealer name={name} phase={phase}. {str(e)}")
            return
        elif component(labels) == "workerpool":
            # this isn't quite right. we will need to incr and decr as pods come and go...
            try:
                if phase == "Running":
                    track_queue_logs(name, namespace, labels)
                    pool_name = labels["app.kubernetes.io/name"]
                    try:
                        pool = customApi.get_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="workerpools", name=pool_name, namespace=namespace)
                    except ApiException as e:
                        logging.error(f"Error patching WorkerPool on pod event name={name} phase={phase}. {str(e)}")

                    ready = int(pool['metadata']['annotations']["codeflare.dev/ready"]) if "codeflare.dev/ready" in pool['metadata']['annotations'] else 0
                    patch_body = { "metadata": { "annotations": { "codeflare.dev/ready": str(ready + 1) } } }

                    logging.info(f"Handling managed pod update for workerpool pool_name={pool_name} phase={phase} prior_ready={ready}")
                    try:
                        customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="workerpools", name=pool_name, namespace=namespace, body=patch_body)
                    except ApiException as e:
                        logging.error(f"Error patching WorkerPool (1) on pod status update pool_name={pool_name} phase={phase}. {str(e)}")
            except Exception as e:
                logging.error(f"Error patching WorkerPool (2) on pod status update name={name} phase={phase}. {str(e)}")

        run_name = labels["app.kubernetes.io/part-of"]
        logging.info(f"Handling managed Pod update run_name={run_name} phase={phase}")
        patch_body = { "metadata": { "annotations": { "codeflare.dev/status": phase, "codeflare.dev/message": "" } } }
        customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="runs", name=run_name, namespace=namespace, body=patch_body)
    except Exception as e:
        logging.error(f"Error patching Run on Pod status update name={name} namespace={namespace}. {str(e)}")

# Watch each managed WorkerPool Pod for creation
@kopf.on.create('pods', labels={"app.kubernetes.io/managed-by": "codeflare.dev", "app.kubernetes.io/component": "workerpool", "app.kubernetes.io/name": kopf.PRESENT, "app.kubernetes.io/part-of": kopf.PRESENT})
def on_pod_create(name: str, namespace: str, body, annotations, labels, spec, patch, **kwargs):
    try:
        on_worker_pod_create(v1Api, customApi, name, namespace, annotations, labels, spec, patch)
    except Exception as e:
        logging.error(f"Error with WorkerPool Pod creation name={name} namespace={namespace}. {str(e)}")

# Watch each managed Pod for deletion
@kopf.on.delete('pods', labels={"app.kubernetes.io/managed-by": "codeflare.dev", "app.kubernetes.io/name": kopf.PRESENT, "app.kubernetes.io/part-of": kopf.PRESENT})
def on_pod_delete(name: str, namespace: str, body, labels, **kwargs):
    try:
        raw_phase = body['status']['phase']
        phase = "Offline" if raw_phase == "Running" else raw_phase

        run_name = labels["app.kubernetes.io/part-of"]
        patch_body = { "metadata": { "annotations": { "codeflare.dev/status": phase } } }
        logging.info(f"Handling managed Pod delete run_name={run_name} phase={phase}")

        resp = customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="runs", name=run_name, namespace=namespace, body=patch_body)
    except ApiException as e:
        if e.status != 404:
            logging.error(f"Error patching Run on Pod delete name={name} namespace={namespace}. {str(e)}")
    except Exception as e:
        logging.error(f"Error patching Run on Pod delete name={name} namespace={namespace}. {str(e)}")

# Watch pod events so we can capture pod scheduling, image pull, etc. status updates and associate them with a Run
@kopf.on.create('events', field="involvedObject.kind", value="Pod")
@kopf.on.update('events', field="involvedObject.kind", value="Pod")
def on_pod_event(name: str, namespace: str, body, **kwargs):
    try:
        if "reason" in body and "component" in body["source"] and body["source"]["component"] != "kopf":
            pod_name = body["involvedObject"]["name"]
            logging.info(f"Pod event for pod_name={pod_name}")
            pod = v1Api.read_namespaced_pod(pod_name, namespace)
            pod_labels = pod.metadata.labels
            if "app.kubernetes.io/managed-by" in pod_labels and pod_labels["app.kubernetes.io/managed-by"] == "codeflare.dev" and "app.kubernetes.io/part-of" in pod_labels:
                phase = body["reason"]
                if "app.kubernetes.io/part-of" in pod_labels:
                    plural = "runs"
                    run_name = pod_labels["app.kubernetes.io/part-of"]
                    patch_body = { "metadata": { "annotations": { "codeflare.dev/status": phase } } }

                    if "message" in body:
                        patch_body["metadata"]["annotations"]["codeflare.dev/message"] = body["message"]
                    else:
                        patch_body["metadata"]["annotations"]["codeflare.dev/message"] = ""

                    logging.info(f"Patching from pod event run_name={run_name} plural={plural} phase={phase}")
                    try:
                        customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural=plural, name=run_name, namespace=namespace, body=patch_body)
                    except ApiException as e:
                        logging.error(f"Error patching Run on pod event run_name={run_name} phase={phase}. {str(e)}")
        else:
            logging.info(f"Dropping event {body}")

    except Exception as e:
        logging.error(f"Error handling pod event name={name} namespace={namespace}. {str(e)}")
