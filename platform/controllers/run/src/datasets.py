import re
import logging
from typing import List, Optional
from kopf import PermanentError

from run_size import sizeof

# confirm that the given dataset `input_name` exists in the given `input_namespace`
def check_exists(customApi, input_name: str, input_namespace: str):
    dataset = customApi.get_namespaced_custom_object(group="com.ie.ibm.hpsys", version="v1alpha1", plural="datasets", name=input_name, namespace=input_namespace)
    if dataset is None:
        raise kopf.TemporaryError(f"Unable to find input DataSet name={input_name} namespace={input_namespace}")

def to_string(datasets: List[str]):
    return "\n".join(datasets) + "\n"

# add the given `dataset` to `dataset_labels_arr` and return `to_string` of it
def add_dataset(dataset: str, useas: str, dataset_labels_arr: List[str]):
    # this assumes the dataset indices start from 0, hence no N+1 here
    if dataset_labels_arr is None:
        dataset_labels_arr = []

    pattern = re.compile(f" {dataset}$")
    if any(pattern.search(label) for label in dataset_labels_arr):
        # dataset label already found. TODO: complain if the existing useas differs...
        logging.info(f"Skipping add_dataset dataset={dataset} dataset_labels_arr={str(dataset_labels_arr)}")
    else:
        N = int(len(dataset_labels_arr) / 2) # one label for id, one label for useas label -- per dataset
        dataset_labels_arr.append(id_label(N, dataset))
        dataset_labels_arr.append(useas_label(N, useas))

    return to_string(dataset_labels_arr)

# datashim dataset.{idx}.id label
def id_label(idx: int, dataset: str):
    return f"dataset.{str(idx)}.id: {dataset}"

# datashim dataset.{idx}.useas label
def useas_label(idx: int, useas: str):
    return f"dataset.{str(idx)}.useas: {useas}"

def prepare_dataset_labels_for_workerpool(customApi, queue_dataset: str, namespace: str, datasets: Optional[List[str]], labels: Optional[List[str]]):
    check_exists(customApi, queue_dataset, namespace)

    dataset_labels = [] if labels is None else labels

    try:
        # are we overriding an existing dataset?
        i = datasets.index(queue_dataset)
        dataset_labels[i] = id_label(i, queue_dataset)
        dataset_labels[i + 1] = useas_label(i, "configmap")
    except:
        # nope, add a new dataset label
        N = int(len(dataset_labels) / 2) # one label for id, one label for useas label -- per dataset
        dataset_labels.append(id_label(N, queue_dataset))
        dataset_labels.append(useas_label(N, "configmap"))

    return to_string(dataset_labels)

def prepare_dataset_labels2(customApi, run_name: str, run_namespace: str, run_spec, application):
    if "inputs" in application["spec"]:
        idx = 0
        labels = []
        datasets = []
        for input in application["spec"]["inputs"]:
            if 'input' in run_spec:
                size = run_spec['input']
            else:
                size = sizeof(input)

            input_name = input["sizes"][size]
            input_namespace = input["namespace"] if "namespace" in input else run_namespace
            input_useas = input["useas"] if "useas" in input else "mount"

            logging.info(f"Fetching dataset size={size} input_name={input_name} input_namespace={input_namespace} input_useas={input_useas}")
            check_exists(customApi, input_name, input_namespace)

            logging.info(f"Preparing dataset label idx={idx} input_name={input_name}")
            datasets.append(input_name)
            labels.append(f"dataset.{str(idx)}.id: {input_name}")
            labels.append(f"dataset.{str(idx)}.useas: {input_useas}")

            idx = idx + 1

        return datasets, labels

    return None, None

def prepare_dataset_labels(customApi, run_name: str, run_namespace: str, run_spec, application):
    datasets, dataset_labels = prepare_dataset_labels2(customApi, run_name, run_namespace, run_spec, application)
    if dataset_labels is None:
        return datasets, dataset_labels, None
    else:
        return datasets, to_string(dataset_labels), dataset_labels
