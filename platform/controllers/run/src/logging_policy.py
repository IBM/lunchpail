import logging

def get_logging_policy(v1Api):
    items = v1Api.list_config_map_for_all_namespaces(label_selector="app.kubernetes.io/part-of=lunchpail.io,app.kubernetes.io/name=fluentbit").items
    logging.info(f"logging policy list {str(items)}")
    logging_policy = sorted(items,
                            key=lambda cm: int(cm.data['priority']) if 'priority' in cm.data else 1)[0].data['fluent-bit.conf']

    logging.info(f"logging policy={logging_policy}")
    return logging_policy
