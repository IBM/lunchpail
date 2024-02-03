import { isDockerInstalled, isDockerContainerRuntimeReady } from "./docker"
import makePodmanRuntimeReady, { isPodmanInstalled, isPodmanMachineReady } from "./podman"

/**
 * Checks which container CLI is installed on the user's system.
 * For now, succeeds if either podman or the docker CLI is found.
 */
export async function containerCliUsed() {
  const [podman, docker] = await Promise.all([isPodmanInstalled(), isDockerInstalled()])
  if (podman) {
    return "podman" as const
  } else if (docker) {
    return "docker" as const
  } else {
    // should we choose a default container/vm CLI/engine to install?
    return null
  }
}

/**
 * Checks the status of the specific container runtime that is found on the user's system
 * Does the machine exist and is it running?
 */
export async function containerRuntimeUsed(): Promise<["docker-engine" | "podman" | null, boolean]> {
  const container = await containerCliUsed()
  if (container === "podman") {
    return isPodmanMachineReady()
  } else if (container === "docker") {
    return isDockerContainerRuntimeReady()
  } else {
    return [null, false]
  }
}

/**
 * Ensures container runtime is ready, meaning the container or machine is created and running.
 * If no container/machine is found, a new one is created and its status set to 'running'.
 * Currently this really only works for podman.
 */
export async function makeContainerRuntimeReady(): Promise<boolean> {
  const [containerRuntime] = await containerRuntimeUsed()
  if (containerRuntime === "podman") {
    await makePodmanRuntimeReady()
    return true
  } else if (containerRuntime === "docker-engine") {
    // TODO: Here we could create docker container if necessary and ensure it is running.
    // await makeDockerContainerRuntimeReady()
    return true
  } else {
    return false
  }
}
