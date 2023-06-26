import logging
from kopf import PermanentError

from run_size import sizeof

def prepare_dataset_labels(customApi, run_name: str, run_namespace: str, run_spec, application):
    if "inputs" in application["spec"]:
        idx = 0
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
            dataset = customApi.get_namespaced_custom_object(group="com.ie.ibm.hpsys", version="v1alpha1", plural="datasets", name=input_name, namespace=input_namespace)
            if dataset is None:
                raise kopf.PermanentError(f"Unable to find input DataSet name={input_name} namespace={input_namespace}")

            logging.info(f"Preparing dataset label idx={idx} input_name={input_name}")
            datasets.append(f"dataset.{str(idx)}.id: {input_name}")
            datasets.append(f"dataset.{str(idx)}.useas: {input_useas}")

            idx = idx + 1

        return "\n".join(datasets) + "\n"
