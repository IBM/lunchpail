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
