import re
import logging
from multiprocessing import Process
from typing import Any, Dict, Iterable

def get_logs(v1Api, args: Dict[str, Any], tail: bool) -> Iterable[str]:
    from kubernetes import watch
    if tail:
        w = watch.Watch()
        iterator = w.stream(v1Api.read_namespaced_pod_log, **args)
    else:
        resp = v1Api.read_namespaced_pod_log(**args)
        iterator = split_lines(resp)
    return iterator   

def track_logs_async(v1Api, customApi, run_name: str, pod_name: str, namespace: str, api: str, patch):
    try:
        log_args : Dict[str, Any] = {
            "name": pod_name,
            "namespace": namespace,
            "timestamps": False,
        }

        if api == "ray":
            log_args["container"] = "job-logs" # TODO... how do we encapsulate this?

        logging.info(f"Tracking logs of pod_name={pod_name} namespace={namespace}")
        iterator = get_logs(v1Api, log_args, True)
    except Exception as e:
        logging.error(f"Error setting up log watcher {e}")

    for line in iterator:
        m = re.search('Epoch (\d+):\s+(\d+%)', line)
        if m is not None:
            epoch = m.group(1)
            epoch_progress= m.group(2)

            try:
                patch_body = { "metadata": { "annotations": { "codeflare.dev/epoch": epoch, "codeflare.dev/epoch-progress": epoch_progress } } }
                customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="runs", name=run_name, namespace=namespace, body=patch_body)
                #patch.metadata.annotations['codeflare.dev/epoch'] = epoch
                #patch.metadata.annotations['codeflare.dev/epoch-progress'] = epoch_progress
            except Exception as e:
                logging.error(f"Error patching log update {e}")

def track_logs(v1Api, customApi, run_name: str, pod_name: str, namespace: str, api: str, patch):
    Process(track_logs_async(v1Api, customApi, run_name, pod_name, namespace, api, patch)).start()
