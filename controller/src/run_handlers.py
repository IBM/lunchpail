import kopf
import logging
import traceback

from kubernetes import client, config
from kubernetes.client.rest import ApiException

from run_size import run_size
from datasets import prepare_dataset_labels, add_dataset

from shell import create_run_shell

from workerpool import create_workerpool
from workdispatcher import create_workdispatcher_ts_ps, create_workdispatcher_application

from find_run import find_run
from fetch_application import fetch_application_for_run, fetch_run_and_application_and_queue_dataset

config.load_incluster_config()
v1Api = client.CoreV1Api()
customApi = client.CustomObjectsApi(client.ApiClient())

# A WorkDispatcher has been created
@kopf.on.create('workdispatchers.lunchpail.io')
def create_workdispatcher_kopf(name: str, namespace: str, uid: str, annotations, spec, patch, **kwargs):
    try:
        run_name = spec['run'] if 'run' in spec else find_run(customApi, namespace)["metadata"]["name"] # todo we'll re-fetch the run a few lines down :(
        run_namespace = namespace
        run, application, queue_dataset = fetch_run_and_application_and_queue_dataset(v1Api, customApi, run_name, run_namespace)
        envFroms = add_dataset(queue_dataset, [])

        # we will then set the status below in the pod status watcher (look for 'component(labels) == "workdispatcher"')
        if spec['method'] == "tasksimulator" or spec['method'] == "parametersweep":
            create_workdispatcher_ts_ps(customApi, name, namespace, uid, spec, run, queue_dataset, envFroms, patch)
        elif spec['method'] == "application":
            create_workdispatcher_application(v1Api, customApi, name, namespace, uid, spec, run, queue_dataset, envFroms, patch)
    except kopf.TemporaryError as e:
        # pass through any TemporaryErrors
        logging.info(f"Passing through TemporaryError for WorkDispatcher creation name={name} namespace={namespace}")
        raise e
    except Exception as e:
        # set_status(name, namespace, 'Failed', patch)
        # add_error_condition(customApi, name, namespace, str(e).strip(), patch)
        traceback.print_exc()
        raise kopf.PermanentError(f"Error handling WorkDispatcher creation. {str(e)}")

# A WorkerPool has been created.
@kopf.on.create('workerpools.lunchpail.io')
def create_workerpool_kopf(name: str, namespace: str, uid: str, annotations, labels, spec, patch, **kwargs):
    try:
        run_name = spec['run'] if 'run' in spec else find_run(customApi, namespace)["metadata"]["name"] # todo we'll re-fetch the run a few lines down :(
        run_namespace = namespace
        run, application, queue_dataset = fetch_run_and_application_and_queue_dataset(v1Api, customApi, run_name, run_namespace)
        volumes, volumeMounts, envFroms = prepare_dataset_labels(application)
        envFroms = add_dataset(queue_dataset, envFroms)

        create_workerpool(v1Api, customApi, application, run, namespace, uid, name, spec, queue_dataset, volumes, volumeMounts, envFroms, patch)
    except kopf.TemporaryError as e:
        # pass through any TemporaryErrors
        # set_status(name, namespace, 'Failed', patch)
        logging.info(f"Passing through TemporaryError for WorkerPool creation name={name} namespace={namespace}")
        raise e
    except Exception as e:
        # set_status(name, namespace, 'Failed', patch)
        # add_error_condition_to_run(customApi, name, namespace, str(e).strip(), patch)
        traceback.print_exc()
        raise kopf.PermanentError(f"Error handling WorkerPool creation name={name}. {str(e)}")

# A Run has been created.
@kopf.on.create('runs.lunchpail.io')
def create_run(name: str, namespace: str, uid: str, labels, spec, body, patch, **kwargs):
    try:
        application = fetch_application_for_run(customApi, body)
        api = application['spec']['api']
        run_size_config = run_size(customApi, name, spec, application)
        volumes, volumeMounts, envFroms = prepare_dataset_labels(application)
        component = labels['app.kubernetes.io/component'] if 'app.kubernetes.io/component' in labels else api

        if api == "shell":
            create_run_shell(v1Api, customApi, application, namespace, uid, name, component, spec, run_size_config, volumes, volumeMounts, envFroms, patch)
        elif api == "workqueue":
            pass
        else:
            raise kopf.PermanentError(f"Invalid api={api} for application={application['metadata']['name']}")

    except kopf.TemporaryError as e:
        # pass through any TemporaryErrors
        logging.info(f"Passing through TemporaryError for Run creation name={name} namespace={namespace}")
        raise e
    except Exception as e:
        # set_status(name, namespace, 'Failed', patch)
        # add_error_condition(customApi, name, namespace, str(e).strip(), patch)
        traceback.print_exc()
        raise kopf.PermanentError(f"Error handling Run creation. {str(e)}")
