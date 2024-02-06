from kopf import PermanentError, TemporaryError
from kubernetes.client.rest import ApiException

from workerpool import find_queue_for_run

def fetch_run_and_application(customApi, run_name: str, run_namespace: str):
    try:
        run = customApi.get_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="runs", name=run_name, namespace=run_namespace)

        application_name = run['spec']['application']['name']
        application_namespace = run['spec']['application']['namespace'] if 'namespace' in run['spec']['application'] else run_namespace

        try:
            application = customApi.get_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="applications", name=application_name, namespace=application_namespace)

            return run, application
        except ApiException as e:
            raise PermanentError(f"Application {application_name} not found. {str(e)}")
    except ApiException as e:
        raise PermanentError(f"Run {run_name} not found. {str(e)}")

def fetch_run_and_application_and_queue_dataset(customApi, run_name: str, run_namespace: str):
    run, application = fetch_run_and_application(customApi, run_name, run_namespace)

    queue_dataset = find_queue_for_run(customApi, run_name, run_namespace)
    if queue_dataset is None:
        raise TemporaryError(f"WorkerPool creation failed due to missing queue dataset run_name={run_name} run_namespace={run_namespace}", delay=4)

    return run, application, queue_dataset
