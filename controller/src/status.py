import logging
from kopf import PermanentError, TemporaryError
from kubernetes.client.rest import ApiException

# Update the status.phase of a given named resource using supplied the kopf `patch`
def set_status(name: str, namespace: str, phase: str, patch, status_field = "status"):
    try:
        logging.info(f"Patching {status_field} name={name} namespace={namespace} phase={phase}")
        patch.metadata.annotations[f"lunchpail.io/{status_field}"] = phase

        if status_field != "ready" and status_field != "reason" and status_field != "message" and not "Failed" in phase:
            # hmm, we need to find a way to clear messages and reasons
            # from prior states of this resource. this is pretty
            # imperfect.
            patch.metadata.annotations["lunchpail.io/reason"] = ""
            patch.metadata.annotations["lunchpail.io/message"] = ""

        # patch.status['phase'] = phase
        #body = [{"op": "replace", "path": "/status/phase", "value": phase}]
        #resp = customApi.patch_namespaced_custom_object_status(group="lunchpail.io", version="v1alpha1", plural="runs", name=name, namespace=namespace, body=body)
    except Exception as e:
        raise PermanentError(f"Error patching status name={name} namespace={namespace}. {str(e)}.")

# Update the status.phase of a given named resource using the kubernetes API
def set_status_immediately(customApi, name: str, namespace: str, phase: str, plural = "runs"):
    try:
        patch_body = { "metadata": { "annotations": { "lunchpail.io/status": phase, "lunchpail.io/message": "" } } }
        customApi.patch_namespaced_custom_object(group="lunchpail.io", version="v1alpha1", plural=plural, name=name, namespace=namespace, body=patch_body)
    except Exception as e:
        logging.error(f"Error patching {plural} on pod event name={name} namespace={namespace} phase={phase}. {str(e)}")

def add_error_condition(customApi, name: str, namespace: str, message: str, patch):
    set_status(name, namespace, message, patch, "message")
#    try:
#        patch.metadata.annotations["lunchpail.io/message"] = message
#    except Exception as e:
#        raise PermanentError(f"Error patching error condition name={name} namespace={namespace} message={message}. {str(e)}.")


# Update the status of the given named resource after a git clone failure
def set_status_after_clone_failure(customApi, name: str, namespace: str, e: Exception, patch):
    msg = str(e)
    logging.info(f"Error while cloning name={name} namespace={namespace}. {msg.strip()}")

    if "Authentication failed" in msg or "access denied" in msg or "returned error: 403" in msg:
        set_status(name, namespace, 'AccessDenied', patch, "reason")
        set_status(name, namespace, 'CloneFailed', patch)
        set_status(name, namespace, "0", patch, "ready")
        add_error_condition(customApi, name, namespace, msg.strip(), patch)
        raise TemporaryError(f"Failed clone due to missing credentials name={name} namespace={namespace}. {msg.strip()}", delay=10)
    else:
        raise e
