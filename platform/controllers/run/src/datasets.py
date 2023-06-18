import logging
from kopf import PermanentError

def prepare_dataset_labels(customApi, run_namespace: str, application):
    if "inputs" in application["spec"]:
        idx = 0
        datasets = []
        for input in application["spec"]["inputs"]:
            input_name = input["name"]
            input_namespace = input["namespace"] if "namespace" in input else run_namespace

            dataset = customApi.get_namespaced_custom_object(group="com.ie.ibm.hpsys", version="v1alpha1", plural="datasets", name=input_name, namespace=input_namespace)
            if dataset is None:
                raise kopf.PermanentError(f"Unable to find input DataSet name={input_name} namespace={input_namespace}")

            logging.info(f"Preparing dataset label idx={idx} input_name={input_name}")
            datasets.append(f"dataset.{str(idx)}.id: {input_name}")
            datasets.append(f"dataset.{str(idx)}.useas: mount")

            idx = idx + 1

        return "\n".join(datasets)
