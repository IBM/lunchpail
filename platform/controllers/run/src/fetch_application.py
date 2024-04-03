from kopf import PermanentError, TemporaryError
from kubernetes.client.rest import ApiException

from workerpool import find_queue_for_run

#
# Find the Application associated with the given Run
#
def fetch_application_for_appref(customApi, application_namespace: str, appref):
    if 'name' in appref:
        # then the application was specified by name
        application_name = appref['name']
        try:
            return customApi.get_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="applications", name=application_name, namespace=application_namespace)

        except ApiException as e:
            raise PermanentError(f"Application {application_name} not found. {str(e)}")
    else:
        # else the application was specified by role
        application_role = appref['fromRole']

        applications_with_role = list(filter(
            lambda app: 'role' in app['spec'] and app['spec']['role'] == application_role,
            customApi.list_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="applications", namespace=application_namespace)['items']
        ))
        match_count = len(applications_with_role)
        if match_count == 0:
            raise TemporaryError(f"No applications with role={application_role} in namespace={application_namespace}")
        elif match_count > 1:
            raise TemporaryError(f"Multiple ({match_count}) applications with role={application_role} in namespace={application_namespace}")

        return applications_with_role[0]

#
# Find the Application associated with the given Run
#
def fetch_application_for_run(customApi, run):
    return fetch_application_for_appref(customApi, run['metadata']['namespace'], run['spec']['application'])

#
# Find the Run and Application resources for the given named Run
#
def fetch_run_and_application(customApi, run_name: str, run_namespace: str):
    try:
        run = customApi.get_namespaced_custom_object(group="codeflare.dev", version="v1alpha1", plural="runs", name=run_name, namespace=run_namespace)
        application = fetch_application_for_run(customApi, run)

        return run, application

    except ApiException as e:
        raise PermanentError(f"Run {run_name} not found. {str(e)}")

#
# Find the Run and Application and TaskQueue (Dataset) resources for
# the given named Run
#
def fetch_run_and_application_and_queue_dataset(customApi, run_name: str, run_namespace: str):
    run, application = fetch_run_and_application(customApi, run_name, run_namespace)
    queue_dataset = find_queue_for_run(customApi, run)
    if queue_dataset is None:
        raise TemporaryError(f"WorkerPool creation failed due to missing queue dataset run_name={run_name} run_namespace={run_namespace}", delay=4)

    return run, application, queue_dataset
