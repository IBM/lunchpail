import logging

def run_size(customApi, spec, application):
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
        
    return run_size_config
