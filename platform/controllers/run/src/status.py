import logging
from kopf import PermanentError
from kubernetes.client.rest import ApiException

# Update the status of a given named resource
def set_status(name: str, namespace: str, phase: str, patch, status_field = "status"):
    try:
        logging.info(f"Patching {status_field} name={name} namespace={namespace} phase={phase}")
        patch.metadata.annotations[f"codeflare.dev/{status_field}"] = phase
        # patch.status['phase'] = phase
        #body = [{"op": "replace", "path": "/status/phase", "value": phase}]
        #resp = customApi.patch_namespaced_custom_object_status(group="codeflare.dev", version="v1alpha1", plural="runs", name=name, namespace=namespace, body=body)
    except ApiException as e:
        raise PermanentError(f"Error patching status name={name} namespace={namespace}. {str(e)}.")

def set_status_immediately(customApi, run_name: str, namespace: str, phase: str):
    try:
        patch_body = { "metadata": { "annotations": { "codeflare.dev/status": phase } } }
        customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="runs", name=run_name, namespace=namespace, body=patch_body)
    except Exception as e:
        logging.error(f"Error patching Run on pod event run_name={run_name} phase={phase}. {str(e)}")
