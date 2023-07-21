from typing import Any, Dict, Iterable, Callable, Optional

def get_logs(v1Api, args: Dict[str, Any], tail: bool) -> Iterable[str]:
    from kubernetes import watch

    if tail:
        w = watch.Watch()
        iterator = w.stream(v1Api.read_namespaced_pod_log, **args)
    else:
        resp = v1Api.read_namespaced_pod_log(**args)
        iterator = split_lines(resp)
    return iterator

def track_logs_async(resource_name: str, pod_name: str, namespace: str, plural: str, line_handler: Callable[[str], Dict[str, Any]], container: Optional[str]):
    try:
        import logging

        from kubernetes import client, config
        config.load_incluster_config()
        v1Api = client.CoreV1Api()
        customApi = client.CustomObjectsApi(client.ApiClient())

        log_args : Dict[str, Any] = {
            "name": pod_name,
            "namespace": namespace,
            "timestamps": False,
        }

        if container is not None and len(container) > 0:
            log_args["container"] = container

        iterator = get_logs(v1Api, log_args, True)
    except Exception as e:
        logging.error(f"Error setting up log watcher. {str(e)}")
        return

    cname = container if container is not None else "<none>"
    logging.info(f"Tracking logs of pod_name={pod_name} namespace={namespace} container={cname}")

    for line in iterator:
        try:
            patch_body = line_handler(line)
            if patch_body is not None:
                try:
                    customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural=plural, name=resource_name, namespace=namespace, body=patch_body)
                except Exception as e:
                    logging.error(f"Error patching log update. {str(e)}")
        except Exception as e:
            logging.error(f"Error patching log update on line={line}. {str(e)}")

# line_handler takes a `line: str` and returns a resource patch `Dict[str, Any]`
from multiprocessing import Process
def track_logs(resource_name: str, pod_name: str, namespace: str, plural: str, line_handler: Callable[[str], Dict[str, Any]], container: Optional[str]):
    proc = Process(target=track_logs_async, args=(resource_name, pod_name, namespace, plural, line_handler, container))
    proc.start()
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
        logging.error(f"Error setting up log tracking run_name={run_name} pod_name={pod_name} namespace={namespace}. {str(e)}")
