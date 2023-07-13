import os
import re
import logging
import subprocess
from kopf import PermanentError

from clone import clone
from run_id import alloc_run_id

def create_run_kubeflow(v1Api, customApi, application, namespace: str, uid: str, name: str, part_of: str, step: str, spec, command_line_options, run_size_config, dataset_labels, patch):
    logging.info(f"Handling KubeFlow Run: {application['metadata']['name']}")

    image = application['spec']['image']

    command = application['spec']['command']
    script = re.sub(r"^python\d+ ", "", command)

    run_id, workdir = alloc_run_id("kubeflow", name)
    cloned_subPath = clone(v1Api, customApi, application, name, workdir)
    subPath = os.path.join(run_id, cloned_subPath)

    #compiler.Compiler().compile(comp, package_path='component.yaml')
    #client.create_run_from_pipeline_package('pipeline.yaml', arguments={'param': 'a', 'other_param': 2})

    logging.info(f"About to call out to kubeflow run_id={run_id} subPath={subPath}")
    try:
        kubeflow_out = subprocess.run([
            "/src/kfp/kubeflow.sh",
            uid,
            name,
            namespace,
            run_id,
            image,
            script,
            subPath
#            str(nWorkers),
#            str(cpu),
#            str(memory),
#            str(gpu),
#            base64.b64encode(dataset_labels.encode('ascii')) if dataset_labels is not None else "",
#            base64.b64encode(json.dumps(runtimeEnv).encode('ascii')),
#            base64.b64encode(logging_policy.encode('ascii')
        ], capture_output=True)
        logging.info(f"Kubeflow callout done for name={name} with returncode={kubeflow_out.returncode}")
    except Exception as e:
        raise PermanentError(f"Failed to launch via kubeflow. {e}")

    if kubeflow_out.returncode != 0:
        raise PermanentError(f"Failed to launch via kubeflow. {kubeflow_out.stderr.decode('utf-8')}")
    else:
        head_pod_name = kubeflow_out.stdout.decode('utf-8')
        logging.info(f"Kubeflow run head_pod_name={head_pod_name}")
        return head_pod_name
