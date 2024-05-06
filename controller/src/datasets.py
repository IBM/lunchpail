import re
import logging
from typing import List, Optional
from kopf import PermanentError

from run_size import sizeof

# add the given `dataset` to `envFroms` and return it
def add_dataset(dataset: str, envFroms):
    if envFroms is None:
        envFroms = []

    envFroms.append({
        "secretRef": {
            "name": dataset
        },
        "prefix": dataset + "_"
    })

    return envFroms

def prepare_dataset_labels_for_workerpool(customApi, queue_dataset: str, namespace: str, envFroms):
    return add_dataset(queue_dataset, envFroms)

def prepare_dataset_labels2(customApi, run_name: str, run_namespace: str, run_spec, application):
    envFroms = []
    volumes = []
    volumeMounts = []

    if "datasets" in application["spec"]:
        idx = 0
        for dataset in application["spec"]["datasets"]:
            name = dataset["name"]
            if "nfs" in dataset:
                volumes.append({
                    "name": name,
                    "nfs": {
                        "path": dataset["nfs"]["path"],
                        "server": dataset["nfs"]["server"],
                    }
                })
                volumeMounts.append({
                    "name": name,
                    "mountPath": dataset["mountPath"] if "mountPath" in dataset else f"/mnt/datasets/{name}",
                })
            elif "s3" in dataset:
                envFroms.append({
                    "secretRef": {
                        "name": dataset["s3"]["secret"]
                    },
                    "prefix": dataset["s3"]["envPrefix"]
                })

    if len(volumes) == 0 and len(volumeMounts) == 0 and len(envFroms) == 0:
        return None, None, None
    else:
        return volumes, volumeMounts, envFroms

def prepare_dataset_labels(customApi, run_name: str, run_namespace: str, run_spec, application):
    return prepare_dataset_labels2(customApi, run_name, run_namespace, run_spec, application)
