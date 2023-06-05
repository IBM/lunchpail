import kopf
import logging
from kubernetes import client, config
from kubernetes.client.rest import ApiException

from ray import create_run_ray
from torch import create_run_torch

config.load_incluster_config()
v1Api = client.CoreV1Api()
customApi = client.CustomObjectsApi(client.ApiClient())

@kopf.on.create('runs.codeflare.dev')
@kopf.on.update('runs.codeflare.dev', field='spec')
def create_run(name, spec, patch, **kwargs):
    application_name = spec['application']

    logging.info(f"Run for application: {application_name}")

    #try:
    #    run = customApi.get_cluster_custom_object(group="codeflare.dev", version="v1alpha1", plural="applications", name=application_name)
    #except ApiException as e:
    #    raise kopf.PermanentError(f"Application {application_name} not found. {str(e)}")

    try:
        application = customApi.get_cluster_custom_object(group="codeflare.dev", version="v1alpha1", plural="applications", name=application_name)
    except ApiException as e:
        raise kopf.PermanentError(f"Application {application_name} not found. {str(e)}")

    if not 'codeflare.dev/namespace' in application['metadata']['annotations']:
        raise kopf.TemporaryError(f"Application {application_name} not yet configured", delay=3)
        
    application_namespace = application['metadata']['annotations']['codeflare.dev/namespace']
    logging.info(f"Targeting application_namespace: {application_namespace}")

    if 'size' in spec:
        size = spec['size']
    elif 'size' in application['spec']:
        size = application['spec']['size']
    else:
        size = "sm"
    
    try:
        items = customApi.list_cluster_custom_object(group="codeflare.dev", version="v1alpha1", plural="runsizeconfigurations")['items']
        run_size_config = sorted(items,
                                 key=lambda rsc: rsc['spec']['priority'] if 'priority' in rsc['spec'] else 1)[0]['spec']['config'][size]
    except ApiException as e:
        logging.info(f"RunSizeConfiguration policy not found")
        run_size_config = {"cpu": 1, "memory": "1Gi", "gpu": 1, "workers": 1}

    if not 'supportsGpu' in spec or not 'supportsGpu' in application['spec'] or spec['supportsGpu'] == False or application['spec']['supportsGpu'] == False:
        logging.info(f"Disabling GPU for this run")
        run_size_config['gpu'] = 0

    if 'workers' in spec:
        run_size_config['workers'] = spec['workers']
    elif 'workers' in application['spec']:
        run_size_config['workers'] = application['spec']['workers']

    logging.info(f"Using run_size_config={str(run_size_config)}")

    if 'options' in spec:
        command_line_options = spec['options']
    elif 'options' in application['spec']:
        command_line_options = application['spec']['options']
    else:
        command_line_options = ""

    try:
        api = application['spec']['api']
        logging.info(f"Found application={application_name} api={api} ns={application_namespace}")

        if api == "ray":
            create_run_ray(v1Api, application, application_namespace, name, spec, command_line_options, run_size_config, patch)
        elif api == "torch":
            create_run_torch(v1Api, application, application_namespace, name, spec, command_line_options, run_size_config, patch)
        else:
            raise kopf.PermanentError(f"Invalid API {api} for application {application_name}.")
    except Exception as e:
        raise kopf.PermanentError(f"Error handling run creation. {str(e)}")
