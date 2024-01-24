from time import sleep
from kubernetes.client.rest import ApiException
from typing import Any, Dict, Iterable, Callable, Optional

def track_logs_async(resource_name: str, pod_name: str, namespace: str, plural: str, line_handler: Callable[[str], Dict[str, Any]], container: Optional[str]=None, group="codeflare.dev", version="v1alpha1"):
    while True:
        try:
            resp = track_logs_async_once(resource_name, pod_name, namespace, plural, line_handler, container, group, version)
            if resp != 0:
                logging.info(f"Giving up on log watcher pod_name={pod_name}")
                break
            else:
                sleep(2)

        except ApiException as e:
            if e.status == 404:
                logging.info(f"Giving up on log watcher as resource has gone away pod_name={pod_name}")
                break
            else:
                raise e

def track_logs_async_once(resource_name: str, pod_name: str, namespace: str, plural: str, line_handler: Callable[[str], Dict[str, Any]], container: Optional[str]=None, group="codeflare.dev", version="v1alpha1"):
    try:
        import logging
        from kubernetes import client, config, watch
        config.load_incluster_config()
        v1Api = client.CoreV1Api()
        customApi = client.CustomObjectsApi(client.ApiClient())

        log_args : Dict[str, Any] = {
            "name": pod_name,
            "namespace": namespace,
            "timestamps": False,
            "since_seconds": 1
        }

        if container is not None and len(container) > 0:
            log_args["container"] = container

        w = watch.Watch()
        iterator = w.stream(v1Api.read_namespaced_pod_log, **log_args)

        cname = container if container is not None else "<none>"
        logging.info(f"Running log watcher running pod_name={pod_name} namespace={namespace} container={cname}")

        for line in iterator:
            patch_body = line_handler(line)
            if patch_body is not None:
                customApi.patch_namespaced_custom_object(group=group, version=version, plural=plural, name=resource_name, namespace=namespace, body=patch_body)

        # watcher exited gracefully
        logging.info(f"log watcher exited gracefully pod_name={pod_name}")

        # make sure the pod is still there, intentionally throwing an ApiException if it is not there
        pod = v1Api.read_namespaced_pod_status(pod_name, namespace)
        if pod is not None and pod.status is not None and pod.status.phase != "Failed" and pod.status.phase != "Terminating":
            # if no exception, we're good to retry
            return 0
        else:
            logging.info(f"log watcher notices pod is no longer Running pod_name={pod_name} phase={pod.status.phase}")
            return 1
    finally:
        if w is not None:
            logging.info(f"Shutting down log watcher resource_name={resource_name} pod_name={pod_name}")
            w.stop()

# line_handler takes a `line: str` and returns a resource patch `Dict[str, Any]`
from multiprocessing import Process
def track_logs(resource_name: str, pod_name: str, namespace: str, plural: str, line_handler: Callable[[str], Dict[str, Any]], container: Optional[str]=None, group="codeflare.dev", version="v1alpha1"):
    while True:
        proc = Process(target=track_logs_async, args=(resource_name, pod_name, namespace, plural, line_handler, container, group, version))
        proc.start()
        proc.join()
        if proc.exitcode is None or proc.exitcode < 0:
            logging.error(f"log watcher exited abnormally exitcode={proc.exitcode} resource_name={resource_name} pod_name={pod_name}")
        else:
            break
    return proc

# this is run-specific
import re
import logging
def look_for_epoch(line: str):
    m = re.search('Epoch (\d+):\s+(\d+%)', line)
    if m is not None:
        epoch = m.group(1)
        epoch_progress= m.group(2)

        patch_body = { "metadata": { "annotations": { "codeflare.dev/epoch": epoch, "codeflare.dev/epoch-progress": epoch_progress } } }
        return patch_body

# this is run-specific
def track_job_logs(run_name: str, pod_name: str, namespace: str, api: str):
    try:
        if api == "ray":
            container = "job-logs" # TODO... how do we encapsulate this?
        else:
            container = ""

        # intentionally fire and forget (how bad is this?)
        track_logs(run_name, pod_name, namespace, "runs", look_for_epoch, container)
    except Exception as e:
        logging.error(f"Error setting up log watcher run_name={run_name} pod_name={pod_name} namespace={namespace}. {str(e)}")
