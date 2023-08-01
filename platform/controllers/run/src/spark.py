import os
import re
import json
import base64
import logging
import subprocess
from kopf import PermanentError

from clone import clone
from run_id import alloc_run_id
from logging_policy import get_logging_policy

# e.g. python3 foo.py -> (python, foo.py)
type_pattern = re.compile("^(\w+)\d+? (.+)$")

# hmm, SparkApplication doesn't seem to like 4Gi
i_suffix_pattern = re.compile("i$")

def create_run_spark(v1Api, customApi, application, namespace: str, uid: str, name: str, part_of: str, step: str, spec, command_line_options, run_size_config, dataset_labels, patch):
    logging.info(f"Handling Spark Run: app={application['metadata']['name']} run={name} part_of={part_of} step={step}")

    image = application['spec']['image']
    command = application['spec']['command']

    type_match = type_pattern.search(command)
    if type_match is None:
        raise PermanentError(f"Unable to determine Spark application type from command={command}")

    app_type = type_match.group(1)
    if app_type is None:
        raise PermanentError(f"Unable to determine Spark application type from command={command}")
    main_file = type_match.group(2)
    if main_file is None:
        raise PermanentError(f"Unable to determine Spark main file from command={command}")
    
    logging.info(f"Spark entrypoint for name={name} type={app_type} main={main_file}")

    run_id, workdir = alloc_run_id("spark", name)
    cloned_subPath = clone(v1Api, customApi, application, name, workdir)
    subPath = os.path.join(run_id, cloned_subPath)

    gpu = run_size_config['gpu']
    cpu = run_size_config['cpu']
    memory = run_size_config['memory']
    nWorkers = run_size_config['workers']

    logging.info(f"About to call out to Spark run_id={run_id} subPath={subPath}")
    try:
        spark_out = subprocess.run([
            "/src/spark.sh",
            uid,
            name,
            namespace,
            part_of,
            step,
            run_id,
            image,
            app_type.capitalize(),
            main_file,
            subPath,
            str(nWorkers),
            str(cpu),
            re.sub(i_suffix_pattern, "", str(memory)).lower(),
            str(gpu),
            base64.b64encode(dataset_labels.encode('ascii')) if dataset_labels is not None else ""
        ], capture_output=True)
        logging.info(f"Spark callout done for name={name} with returncode={spark_out.returncode}")
    except Exception as e:
        raise PermanentError(f"Failed to launch via Spark. {e}")

    if spark_out.returncode != 0:
        raise PermanentError(f"Failed to launch via Spark. {spark_out.stderr.decode('utf-8')}")
    else:
        head_pod_name = spark_out.stdout.decode('utf-8')
        logging.info(f"Spark run head_pod_name={head_pod_name}")
        return head_pod_name
    
