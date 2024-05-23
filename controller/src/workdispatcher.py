import os
import json
import shutil
import base64
import logging
import tempfile
import subprocess
from kopf import PermanentError, TemporaryError
from kubernetes.client.rest import ApiException

from run_id import alloc_run_id
from fetch_application import fetch_application_for_appref

#
# Handle WorkDispatcher creation for method=tasksimulator or method=parametersweep
#
def create_workdispatcher_ts_ps(customApi, name: str, namespace: str, uid: str, spec, run, queue_dataset: str, envFroms, patch, path_to_chart = "", values = ""):
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

    logging.info(f"About to call out to WorkerDispatcher launcher envFroms={envFroms}")
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
            base64.b64encode(json.dumps(envFroms).encode('ascii')) if envFroms is not None and len(envFroms) > 0 else "",
            path_to_chart,
            values,
            run_name,
        ], capture_output=True)
        logging.info(f"WorkDispatcher callout done for name={name} with returncode={out.returncode}")
    except Exception as e:
        # set_status(name, namespace, 'Failed', patch)
        # add_error_condition(customApi, name, namespace, str(e).strip(), patch)
        raise PermanentError(f"Failed to launch WorkDispatcher. {e}")

    if out is not None and out.returncode != 0:
        message = out.stderr.decode('utf-8')
        # set_status(name, namespace, 'Failed', patch)
        # add_error_condition(customApi, name, namespace, message, patch)
        raise PermanentError(f"Failed to launch WorkDispatcher. {message}")
    else:
        #head_pod_name = out.stdout.decode('utf-8')
        #logging.info(f"Ray run head_pod_name={head_pod_name}")
        #return head_pod_name
        return ""
