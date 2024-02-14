import { promisify } from "node:util"
import { exec } from "node:child_process"

/**
 * Attempt to determine which Kubernetes namespace we are using for
 * the control plane by looking at what is running in that context.
 */
export async function getControlPlaneNamespaceForExistingInstallation(context: string) {
  const execPromise = promisify(exec)
  const controllers = await execPromise(
    `kubectl get deployment --context ${context} -A -l app.kubernetes.io/name=run-controller -o json`,
  ).then((_) => JSON.parse(_.stdout))

  if (!controllers) {
    throw new Error("Control plane namespace not found")
  } else {
    const controlPlaneNamespace = controllers.items[0].metadata.namespace
    // console.log(`Using control plane namespace |${controlPlaneNamespace}|`)
    return controlPlaneNamespace
  }
}
