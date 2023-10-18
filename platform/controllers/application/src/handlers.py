import kopf
import logging
from kubernetes import client, config
from kubernetes.client.rest import ApiException

config.load_incluster_config()
v1Api = client.CoreV1Api()
customApi = client.CustomObjectsApi(client.ApiClient())

def set_status(name: str, namespace: str, phase: str, plural = "applications", group = "codeflare.dev", version = "v1alpha1", field = "status"):
    patch_body = { "metadata": { "annotations": { f"codeflare.dev/{field}": phase } } }

    try:
        if namespace is None:
          resp = customApi.patch_cluster_custom_object(
              group=group,
              version=version,
              plural=plural,
              name=name,
              body=patch_body
          )
        else:
          resp = customApi.patch_namespaced_custom_object(
              group=group,
              version=version,
              plural=plural,
              name=name,
              namespace=namespace,
              body=patch_body
          )
    except Exception as e:
        logging.error(f"Error patching {plural}.{group} name={name} namespace={namespace} phase={phase}. {str(e)}")

@kopf.on.create('applications.codeflare.dev')
def create_application(name: str, namespace: str, spec, patch, **kwargs):
    logging.info(f"Handling Application create name={name}")
    set_status(name, namespace, "Ready")

@kopf.on.delete('applications.codeflare.dev')
def delete_application(name: str, namespace: str, spec, patch, **kwargs):
    logging.info(f"Handling Application delete name={name}")
    set_status(name, namespace, "Terminating")

@kopf.on.create('platformreposecrets.codeflare.dev')
def create_platformreposecret(name: str, namespace: str, spec, patch, **kwargs):
    logging.info(f"Handling PlatformRepoSecret create name={name} namespace={namespace}")
    set_status(name, namespace, "Ready", "platformreposecrets")

@kopf.on.delete('platformreposecrets.codeflare.dev')
def delete_platformreposecret(name: str, namespace: str, spec, patch, **kwargs):
    logging.info(f"Handling PlatformRepoSecret delete name={name}")
    set_status(name, namespace, "Terminating", "platformreposecrets")
    
@kopf.on.create('datasets.com.ie.ibm.hpsys')
def create_dataset(name: str, namespace: str, spec, patch, **kwargs):
    logging.info(f"Handling Dataset create name={name}")
    set_status(name, namespace, "Ready", "com.ie.ibm.hpsys", "v1alpha1", "datasets")
    set_status(name, namespace, "0", "datasets", "com.ie.ibm.hpsys", "v1alpha1", "unassigned")

@kopf.on.delete('datasets.com.ie.ibm.hpsys')
def delete_dataset(name: str, namespace: str, spec, patch, **kwargs):
    logging.info(f"Handling Dataset delete name={name}")
    set_status(name, namespace, "Terminating", "datasets", "com.ie.ibm.hpsys", "v1alpha1")
