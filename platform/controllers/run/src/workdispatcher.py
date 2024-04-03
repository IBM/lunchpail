import os
import shutil
import base64
import logging
import tempfile
import subprocess
from kopf import PermanentError, TemporaryError
from kubernetes.client.rest import ApiException

from clone import clone_from_git
from run_id import alloc_run_id
from fetch_application import fetch_application_for_appref

from status import set_status, add_error_condition, set_status_after_clone_failure

#
# Handle WorkDispatcher creation for method=tasksimulator or method=parametersweep or method=helm
#
def create_workdispatcher_ts_ps(customApi, name: str, namespace: str, uid: str, spec, run, queue_dataset: str, dataset_labels, patch, path_to_chart = "", values = ""):
    method = spec['method']
    injectedTasksPerInterval = spec['rate']['tasks'] if "rate" in spec else 1
    intervalSeconds = spec['rate']['intervalSeconds'] if "rate" in spec and "intervalSeconds" in spec['rate'] else 10

    if 'schema' in spec:
        fmt = spec['schema']['format']
        columns = spec['schema']['columns']
        columnTypes = spec['schema']['columnTypes']
    else:
        fmt = ""
        columns = []
        columnTypes = []

    sweep_min = spec['sweep']['min'] if 'sweep' in spec else ""
    sweep_max = spec['sweep']['max'] if 'sweep' in spec else ""
    sweep_step = spec['sweep']['step'] if 'sweep' in spec else ""

    run_name = run['metadata']['name']
    
    try:
        out = subprocess.run([
            "./workdispatcher.sh",
            uid,
            name,
            namespace,
            method,
            str(injectedTasksPerInterval),
            str(intervalSeconds),
            fmt,
            " ".join(map(str, columns)), # for CSV header, we want commas, but helm doesn't like commas https://github.com/helm/helm/issues/1556
            " ".join(map(str, columnTypes)), # for bash loop iteration, hence the space join
            str(sweep_min),
            str(sweep_max),
            str(sweep_step),
            queue_dataset,
            base64.b64encode(dataset_labels.encode('ascii')) if dataset_labels is not None else "",
            path_to_chart,
            values,
            run_name,
        ], capture_output=True)
        logging.info(f"WorkDispatcher callout done for name={name} with returncode={out.returncode}")
    except Exception as e:
        set_status(name, namespace, 'Failed', patch)
        add_error_condition(customApi, name, namespace, str(e).strip(), patch)
        raise PermanentError(f"Failed to launch WorkDispatcher. {e}")

    if out is not None and out.returncode != 0:
        message = out.stderr.decode('utf-8')
        set_status(name, namespace, 'Failed', patch)
        add_error_condition(customApi, name, namespace, message, patch)
        raise PermanentError(f"Failed to launch WorkDispatcher. {message}")
    else:
        #head_pod_name = out.stdout.decode('utf-8')
        #logging.info(f"Ray run head_pod_name={head_pod_name}")
        #return head_pod_name
        return ""

#
# Handle WorkDispatcher creation for method=helm
#
def create_workdispatcher_helm(v1Api, customApi, name: str, namespace: str, uid: str, spec, run, queue_dataset: str, dataset_labels, patch):
    logging.info(f"Creating WorkDispatcher from helm name={name} namespace={namespace}")
    run_id = alloc_run_id("helm", name)
    workdir = tempfile.mkdtemp()

    try:
        cloned_subPath = clone_from_git(v1Api, customApi, name, namespace, workdir, spec['repo'])
    except Exception as e:
        # failed clone
        set_status_after_clone_failure(customApi, name, namespace, e, patch)
    else:
        # successful clone
        path_to_chart = os.path.join(workdir, cloned_subPath)
        values = spec['values'] if 'values' in spec else ""
        create_workdispatcher_ts_ps(customApi, name, namespace, uid, spec, run, queue_dataset, dataset_labels, patch, path_to_chart, values)
#    finally:
        # in either case, remove our `tempfile.mkdtemp()` temporary directory
#        shutil.rmtree(workdir)

#
# Handle WorkDispatcher creation for method=application
#
def create_workdispatcher_application(v1Api, customApi, workdispatcher_name: str, workdispatcher_namespace: str, workdispatcher_uid: str, spec, run, queue_dataset: str, dataset_labels, patch):
    logging.info(f"Creating WorkDispatcher from application name={workdispatcher_name} namespace={workdispatcher_namespace} queue_dataset={queue_dataset}")

    workdispatcher_app_namespace = workdispatcher_namespace
    workdispatcher_app_name = fetch_application_for_appref(customApi, workdispatcher_app_namespace, spec['application'])['metadata']['name'] # todo we re-fetch this just below
    workdispatcher_app_size = spec['application']['size'] if 'size' in spec['application'] else "xxs"

    # confirm that the linked application exists
    try:
        application = customApi.get_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="applications", name=workdispatcher_app_name, namespace=workdispatcher_app_namespace)
    except ApiException as e:
        message = f"Application {workdispatcher_app_name} not found. {str(e)}"
        set_status(workdispatcher_name, workdispatcher_namespace, 'Failed', patch)
        add_error_condition(customApi, workdispatcher_name, workdispatcher_namespace, message, patch)
        raise TemporaryError(message)
    
    run_name = run['metadata']['name']

    # product name; used in paths
    lunchpail = os.getenv("LUNCHPAIL")

    # environment variables; merge application spec with workdispatcher spec
    env = application['spec']['env'] if application is not None and 'env' in application['spec'] else {}
    if 'env' in spec:
        env.update(spec['env'])
    env.update({
        "RUN_NAME": run_name, # the original run name that the dispatcher is associated with, not the Run we will create below for the Dispatcher Application
        "WORKQUEUE": "/queue",
        "S3_ENDPOINT_VAR": f"{queue_dataset}_endpoint",
        "AWS_ACCESS_KEY_ID_VAR": f"{queue_dataset}_accessKeyID",
        "AWS_SECRET_ACCESS_KEY_VAR": f"{queue_dataset}_secretAccessKey",
        "TASKQUEUE_VAR": f"{queue_dataset}_bucket",
        "LUNCHPAIL": lunchpail,
    })

    group = "codeflare.dev"
    version = "v1alpha1"
    plural = "runs"
    queue_useas = 'configmap'

    if 'queue' in spec['application'] and 'useas' in spec['application']['queue']:
        queue_useas = spec['application']['queue']['useas']
        env.update({
            "INBOX": f"/mnt/datasets/{queue_dataset}/{lunchpail}/{run_name}/inbox",
            "OUTBOX": f"/mnt/datasets/{queue_dataset}/{lunchpail}/{run_name}/outbox",
        })

    body = {
        "apiVersion": "codeflare.dev/v1alpha1",
        "kind": "Run",
        "metadata": {
            "name": workdispatcher_name + "-dispatcher",
            "labels": {
                "app.kubernetes.io/name": workdispatcher_name,
                # TODO, this currently results in the pod status tracker updating run_name "app.kubernetes.io/part-of": run_name,
                "app.kubernetes.io/managed-by": "codeflare.dev",
                "app.kubernetes.io/component": "workdispatcher"
            },
            "ownerReferences": [{
                "apiVersion": "v1",
                "kind": "WorkDispatcher",
                "controller": True,
                "name": workdispatcher_name,
                "uid": workdispatcher_uid,
            }]
        },
        "spec": {
            "size": workdispatcher_app_size,
            "application": {
                "name": workdispatcher_app_name,
                "namespace": workdispatcher_app_namespace
            },
            "env": env,
            "queue": {
                "dataset": {
                    "name": queue_dataset,
                    "useas": queue_useas,
                }
            }
        }
    }
    
    customApi.create_namespaced_custom_object(group, version, workdispatcher_namespace, plural, body)
