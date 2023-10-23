import os
import base64
import logging
import subprocess
from kopf import PermanentError, TemporaryError

from status import set_status, add_error_condition

def create_tasksimulator(customApi, name: str, namespace: str, uid: str, spec, dataset_labels, patch):
    dataset = spec['dataset']
    injectedTasksPerInterval = spec['rate']['tasks']
    frequencyInSeconds = spec['rate']['frequencyInSeconds'] if "frequencyInSeconds" in spec['rate'] else 10
    
    try:
        out = subprocess.run([
            "/src/tasksimulator.sh",
            uid,
            name,
            namespace,
            str(injectedTasksPerInterval),
            str(frequencyInSeconds),
            dataset,
            base64.b64encode(dataset_labels.encode('ascii')) if dataset_labels is not None else "",
        ], capture_output=True)
        logging.info(f"TaskSimulator callout done for name={name} with returncode={out.returncode}")
    except Exception as e:
        set_status(name, namespace, 'Failed', patch)
        add_error_condition(customApi, name, namespace, str(e).strip(), patch)
        raise PermanentError(f"Failed to launch TaskSimulator. {e}")

    if out is not None and out.returncode != 0:
        message = out.stderr.decode('utf-8')
        set_status(name, namespace, 'Failed', patch)
        add_error_condition(customApi, name, namespace, message, patch)
        raise PermanentError(f"Failed to launch TaskSimulator. {message}")
    else:
        #head_pod_name = out.stdout.decode('utf-8')
        #logging.info(f"Ray run head_pod_name={head_pod_name}")
        #return head_pod_name
        return ""
