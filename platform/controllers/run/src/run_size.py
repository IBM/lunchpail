import logging
from kubernetes.client.rest import ApiException

def sizeof(inp):
    if 'defaultSize' in inp:
        return inp['defaultSize']
    else:
        sizes = inp['sizes']
        if 'xxs' in sizes:
            return 'xxs'
        elif 'xs' in sizes:
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

default_config = {
    "spec": {
        "config": {
            "xxs": {
                "workers": 1,
                "cpu": "500m",
                "memory": "1.5Gi",
                "gpu": 0,
            },
            "xs": {
                "workers": 1,
                "cpu": 1,
                "memory": "4Gi",
                "gpu": 1,
            },
            "sm": {
                "workers": 2,
                "cpu": 1,
                "memory": "8Gi",
                "gpu": 1,
            },
            "md": {
                "workers": 4,
                "cpu": 2,
                "memory": "16Gi",
                "gpu": 1,
            },
            "lg": {
                "workers": 8,
                "cpu": 4,
                "memory": "32Gi",
                "gpu": 1,
            },
            "xl": {
                "workers": 20,
                "cpu": 4,
                "memory": "48Gi",
                "gpu": 1,
            },
            "xxl": {
                "workers": 40,
                "cpu": 8,
                "memory": "64Gi",
                "gpu": 1,
            }
        }
    }
}

def load_run_size_config(customApi, size: str):
    try:
        items = customApi.list_cluster_custom_object(group="codeflare.dev", version="v1alpha1", plural="runsizeconfigurations")['items']
        return sorted(items,
                      key=lambda rsc: rsc['spec']['priority'] if 'priority' in rsc['spec'] else 1)[0]['spec']['config'][size]
    except Exception as e:
        logging.info(f"RunSizeConfiguration policy not found for size={size}")
        try:
            return default_config['spec']['config'][size].copy() # copy since we may modify it below!!
        except Exception as e2:
            logging.info(f"RunSizeConfiguration default policy has no rule for size={size}")
            return {"cpu": "500m", "memory": "500Mi", "gpu": 0, "workers": 1}

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

    run_size_config = load_run_size_config(customApi, size)
    logging.info(f"Using size={size} for run={name} run_size_config(base)={run_size_config}")

    # TODOs:
    # 1) the default-run-size-config should not include GPUs if the cluster does not support them
    # 2) we need to detect this situation here; i.e. if the cluster-default run_size_config['gpu']=0, then `clusterSupportsGpu=false`
    runAskedForGpu = 'supportsGpu' in spec and spec['supportsGpu'] == True
    runDisabledGpu = 'supportsGpu' in spec and spec['supportsGpu'] == False
    appSupportsGpu = 'supportsGpu' in application['spec'] and application['spec']['supportsGpu'] == True
    if not appSupportsGpu or not runAskedForGpu or runDisabledGpu:
        # then the application or run asked for a gpu; check to see if the run overrides this
        logging.info(f"Disabling GPU for this run")
        run_size_config['gpu'] = 0

    if 'workers' in spec:
        logging.info(f"Using workers from Run spec for run_size_config workers={spec['workers']}")
        run_size_config['workers'] = spec['workers']
    elif 'workers' in application['spec']:
        logging.info(f"Using workers from Application spec for run_size_config workers={application['spec']['workers']}")
        run_size_config['workers'] = application['spec']['workers']
        
    return run_size_config
