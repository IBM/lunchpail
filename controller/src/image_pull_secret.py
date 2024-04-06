import re
import logging
from kubernetes import client

# see if we have a matching PlatformImagePullSecret
def find_image_pull_secret(v1Api, customApi, image: str, target_namespace: str):
    try:
        allSecrets = customApi.list_cluster_custom_object(group="lunchpail.io", version="v1alpha1", plural="platformimagepullsecrets")['items']
        logging.info(f"PlatformImagePullSecrets {allSecrets}")
        matchingSecrets = list(filter(lambda prs: re.search(prs['spec']['repo'], repo) is not None,
                                    allSecrets))
        if len(matchingSecrets) > 0:
            # We found a matching PlatformImagePullSecret! TODO which one?
            pips = matchingSecrets[0]['spec']
            secret_name = pips['secret']['name']
            secret_namespace = pips['secret']['namespace']

            if secret_namespace != target_namespace:
                # we may need to clone the secret
                target_name = f"cf_{secret_name}"
                secret = v1Api.read_namespaced_secret(secret_name, namespace)

                existing = list(filter(lambda secret: secret.metadata.name == target_name), v1Api.list_namespaced_secret(target_namespace)['items'])
                if len(existing) == 0:
                    # then we need to copy over

                    logging.info(f"Copying image pull secret name={secret_name} source_namespace={secret_namespace} target_namespace={target_namespace}")
                    body = client.V1Secret()
                    body.api_version = secret.api_version
                    body.data = secret.data
                    body.kind = secret.kind
                    body.metadata = {'name': secret_name}
                    body.type = secret.type
                    v1Api.create_namespaced_secret(target_namespace, body)

                # TODO handle updates to the source secret
                return target_name
            else:
                return secret_name
    except Exception as e:
        logging.info(f"Error managing PlatformImagePullSecret image={image} target_namespace={target_namespace}. {str(e)}")
