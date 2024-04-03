from kopf import TemporaryError

#
# We are inferring a Run e.g. for a WorkerPool or WorkDispatcher. This
# filters a given Run for inclusion in the set of candidates. If we
# have a Run that is linked to an Application by role=worker, we'll
# accept it. Otherwise, look for Runs that aren't part of the
# WorkDispatcher (see workdispatcher.py, it generates a Run)
#
def candidate_runs_filter(run):
    return 'fromRole' in run['spec']['application'] and run['spec']['application']['fromRole'] == 'worker' or not 'labels' in run['metadata'] or not 'app.kubernetes.io/component' in run['metadata']['labels'] or run['metadata']['labels']['app.kubernetes.io/component'] != "workdispatcher"

#
# Find a Run 
#
def find_run(customApi, namespace: str):
    runs = list(filter(
        candidate_runs_filter,
        customApi.list_namespaced_custom_object(
            group="codeflare.dev",
            version="v1alpha1",
            plural="runs",
            namespace=namespace)['items']
    ))

    if len(runs) == 0:
        raise TemporaryError(f"No Runs found in namespace={namespace}")
    elif len(runs) > 1:
        raise TemporaryError(f"Multiple ({len(runs)}) Runs in namespace={namespace}")
    else:
        return runs[0]

        
