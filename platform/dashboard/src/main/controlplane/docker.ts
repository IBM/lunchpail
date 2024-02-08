import which from "which"
import { promisify } from "node:util"
import { exec } from "node:child_process"

/**
 * TODO: This check doesn't check for the docker daemon and docker CLI separetely.
 * This can be implemented later.
 */
export async function isDockerInstalled(): Promise<boolean> {
  return !!(await which("docker", { nothrow: true }))
}

async function getDockerContainerRuntime(): Promise<null | {
  ContainerID: string
  Image: string
  Command: string
  Created: string
  Status: string
  Ports: string
  Names: string
}> {
  try {
    const execPromise = promisify(exec)
    const machines = await execPromise("docker ps -a").then((_) => JSON.parse(_.stdout))
    const machine = machines[0] // FIXME: assuming the first docker container in the array is the one we're looking for
    return machine
  } catch (err) {
    console.error(err)
    return null
  }
}

export async function isDockerContainerRuntimeReady(): Promise<["docker-engine" | "podman", boolean]> {
  const machine = await getDockerContainerRuntime()
  if (!machine) {
    return ["docker-engine", false]
  } else {
    const runningState = !/(Paused)/.test(machine.Status)
    return ["docker-engine", runningState]
  }
}

/**
 * Eventually we'll want to prepare a docker container by creating a container if
 * necessary, and making sure it is running.
 */
// export default async function makeDockerContainerRuntimeReady() {}
