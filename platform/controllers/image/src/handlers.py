import kopf
import logging

from kubernetes import client, config
from kubernetes.client.rest import ApiException

config.load_incluster_config()
v1Api = client.CoreV1Api()
customApi = client.CustomObjectsApi(client.ApiClient())

kube_fledged = {
    "version": "v1alpha2",
    "group": "kubefledged.io",
    "plural": "imagecaches"
}

# A Run has been created.
@kopf.on.create('images.codeflare.dev')
def on_image_create(name: str, namespace: str, spec, patch, **kwargs):
    logging.info(f"Image create name={name} namespace={namespace} spec={spec}")

    try:
        image_caches = customApi.list_cluster_custom_object(group=kube_fledged["group"],
                                                            version=kube_fledged["version"],
                                                            plural=kube_fledged["plural"],
                                                            label_selector="app.kubernetes.io/part-of=codeflare.dev")
        logging.info(f"Found image caches {image_caches}")
        image_cache = image_caches["items"][0] # TODO
    except Exception as e:
        logging.error(f"Cannot find image cache to manage this image name={name} namespace={namespace} err={e}")
        return

    cacheSpec = image_cache["spec"]["cacheSpec"] if "spec" in image_cache and "cacheSpec" in image_cache["spec"] else []
    existing_images = cacheSpec[0]["images"] if len(cacheSpec) > 0 and "images" in cacheSpec[0] else []
    logging.info(f"existing_images={existing_images}")
    existing_images.append(spec["image"])
    image_cache_patch_body = {
        "spec": {
            "cacheSpec": cacheSpec
        }
    }

    try:
        ic_name = image_cache["metadata"]["name"]
        ic_namespace = image_cache["metadata"]["namespace"]
        logging.info(f"Patching image_cache_name={ic_name} image_cache_namespace={ic_namespace} patch={image_cache_patch_body}")
        customApi.patch_namespaced_custom_object(group=kube_fledged["group"],
                                                 version=kube_fledged["version"],
                                                 plural=kube_fledged["plural"],
                                                 name=ic_name,
                                                 namespace=ic_namespace,
                                                 body=image_cache_patch_body)
    except ApiException as e:
        if e.code == 500:
            raise kopf.TemporaryError(f"Error patching image cache. {str(e)}")
        else:
            raise kopf.PermanentError(f"Error patching image cache. {str(e)}")
        
