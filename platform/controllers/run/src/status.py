import logging
from kopf import PermanentError
from kubernetes.client.rest import ApiException

# Update the status.phase of a given named resource using supplied the kopf `patch`
def set_status(name: str, namespace: str, phase: str, patch, status_field = "status"):
    try:
        logging.info(f"Patching {status_field} name={name} namespace={namespace} phase={phase}")
        patch.metadata.annotations[f"codeflare.dev/{status_field}"] = phase

        if status_field != "ready" and status_field != "reason" and status_field != "message" and not "Failed" in phase:
            # hmm, we need to find a way to clear messages and reasons
            # from prior states of this resource. this is pretty
            # imperfect.
            patch.metadata.annotations["codeflare.dev/reason"] = ""
            patch.metadata.annotations["codeflare.dev/message"] = ""

        # patch.status['phase'] = phase
        #body = [{"op": "replace", "path": "/status/phase", "value": phase}]
        #resp = customApi.patch_namespaced_custom_object_status(group="codeflare.dev", version="v1alpha1", plural="runs", name=name, namespace=namespace, body=body)
    except Exception as e:
        raise PermanentError(f"Error patching status name={name} namespace={namespace}. {str(e)}.")

# Update the status.phase of a given named resource using the kubernetes API
def set_status_immediately(customApi, name: str, namespace: str, phase: str, plural = "runs"):
    try:
        patch_body = { "metadata": { "annotations": { "codeflare.dev/status": phase, "codeflare.dev/message": "" } } }
        customApi.patch_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural=plural, name=name, namespace=namespace, body=patch_body)
    except Exception as e:
        logging.error(f"Error patching {plural} on pod event name={name} namespace={namespace} phase={phase}. {str(e)}")

def add_error_condition(customApi, name: str, namespace: str, message: str, patch):
    set_status(name, namespace, message, patch, "message")
#    try:
#        patch.metadata.annotations["codeflare.dev/message"] = message
#    except Exception as e:
#        raise PermanentError(f"Error patching error condition name={name} namespace={namespace} message={message}. {str(e)}.")
