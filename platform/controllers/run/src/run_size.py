import logging

def sizeof(inp):
    if 'defaultSize' in inp:
        return inp['defaultSize']
    else:
        sizes = inp['sizes']
        if 'xs' in sizes:
            return 'xs'
        elif 'sm' in sizes:
            return 'sm'
        elif 'md' in sizes:
            return 'md'
        elif 'lg' in sizes:
            return 'lg'
        elif 'xl' in sizes:
            return 'xl'
        elif 'xxl' in sizes:
            return 'xxl'

def run_size(customApi, name: str, spec, application):
    size = "xs" # default
    if 'size' in spec:
        size = spec['size']
    elif 'input' in spec:
        size = spec['input']
    elif 'inputs' in application['spec']:
        inputs = application["spec"]["inputs"]
        logging.info(f"Scanning inputs for a run size run={name} inputs={inputs}")
        for inp in inputs:
            # TODO this isn't right; what do we do for multi-input applications?
            size = sizeof(inp)
    logging.info(f"Using size={size} for run={name}")

    try:
        items = customApi.list_cluster_custom_object(group="codeflare.dev", version="v1alpha1", plural="runsizeconfigurations")['items']
        run_size_config = sorted(items,
                                 key=lambda rsc: rsc['spec']['priority'] if 'priority' in rsc['spec'] else 1)[0]['spec']['config'][size]
    except ApiException as e:
        logging.info(f"RunSizeConfiguration policy not found")
        run_size_config = {"cpu": 1, "memory": "1Gi", "gpu": 1, "workers": 1}

    runAskedForGpu = 'supportsGpu' in spec and spec['supportsGpu'] == True
    runDisabledGpu = 'supportsGpu' in spec and spec['supportsGpu'] == False
    appSupportsGpu = 'supportsGpu' in application['spec'] and application['spec']['supportsGpu'] == True
    if not appSupportsGpu or not runAskedForGpu or runDisabledGpu:
        # then the application or run asked for a gpu; check to see if the run overrides this
        logging.info(f"Disabling GPU for this run")
        run_size_config['gpu'] = 0

    if 'workers' in spec:
        run_size_config['workers'] = spec['workers']
    elif 'workers' in application['spec']:
        run_size_config['workers'] = application['spec']['workers']
        
    return run_size_config
