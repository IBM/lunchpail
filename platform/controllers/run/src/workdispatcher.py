import os
import base64
import logging
import subprocess
from kopf import PermanentError, TemporaryError

from clone import clone_from_git
from run_id import alloc_run_id

from status import set_status, add_error_condition, set_status_after_clone_failure

#
# Handle WorkDispatcher creation for method=tasksimulator or method=parametersweep or method=helm
#
def create_workdispatcher_ts_ps(customApi, name: str, namespace: str, uid: str, spec, dataset_labels, patch, path_to_chart = "", values = ""):
    method = spec['method']
    dataset = spec['dataset']
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
        
    try:
        out = subprocess.run([
            "/src/workdispatcher.sh",
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
            dataset,
            base64.b64encode(dataset_labels.encode('ascii')) if dataset_labels is not None else "",
            path_to_chart,
            values,
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
def create_workdispatcher_helm(v1Api, customApi, name: str, namespace: str, uid: str, spec, dataset_labels, patch):
    logging.info(f"Creating WorkDispatcher from helm name={name} namespace={namespace}")
    run_id, workdir = alloc_run_id("helm", name)

    try:
        cloned_subPath = clone_from_git(v1Api, customApi, name, workdir, spec['repo'])
    except Exception as e:
        set_status_after_clone_failure(customApi, name, namespace, e, patch)
    
    path_to_chart = os.path.join(workdir, cloned_subPath)
    values = spec['values'] if 'values' in spec else ""
    create_workdispatcher_ts_ps(customApi, name, namespace, uid, spec, dataset_labels, patch, path_to_chart, values)

    
