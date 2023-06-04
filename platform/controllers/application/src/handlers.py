import kopf
import logging
from kubernetes import client, config
from kubernetes.client.rest import ApiException

config.load_incluster_config()
v1Api = client.CoreV1Api()
#customApi = client.CustomObjectsApi(client.ApiClient())

@kopf.on.create('applications.codeflare.dev')
@kopf.on.update('applications.codeflare.dev', field='spec')
def create_application(name, spec, patch, **kwargs):
    namespace = f"codeflare-application-{name}"
    try:
        v1Api.create_namespace(body = client.V1Namespace(metadata=client.V1ObjectMeta(name=namespace)))
        logging.info(f"Created namespace for application named {name} with namespace={namespace}")
    except ApiException as e:
        if e.status != 409:
            raise e

    patch.metadata.annotations['codeflare.dev/namespace'] = namespace
