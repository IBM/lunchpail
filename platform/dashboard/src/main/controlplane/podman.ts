import which from "which"
import { promisify } from "node:util"
import { exec, spawn } from "node:child_process"

/** Resource requests for the podman virtual machine */
const resources = {
  memory: 8192,
}

export async function isPodmanCliReady(): Promise<boolean> {
  return !!(await which("podman", { nothrow: true }))
}

async function installPodmanCliIfNeeded() {
  if (!(await isPodmanCliReady())) {
    if (process.platform === "darwin") {
      console.log("Installing podman cli")
      const execPromise = promisify(exec)
      await execPromise("brew install podman")
    } else {
      throw new Error("podman not installed")
    }
  }
}

async function getPodmanMachine(): Promise<null | {
  Name: string
  State: string
  Rootful: boolean
  Resources: { Memory: number }
}> {
  try {
    const execPromise = promisify(exec)
    const machines = await execPromise("podman machine inspect").then((_) => JSON.parse(_.stdout))
    const machine = machines[0] // .find(_ => _.name === podmanMachineName)
    return machine
  } catch (err) {
    console.error(err)
    return null
  }
}

export async function isPodmanMachineReady(): Promise<boolean> {
  return !!(await getPodmanMachine())
}

function initMachine() {
  return new Promise((resolve, reject) => {
    console.log("Creating podman machine")
    const resourceOpts = Object.entries(resources).flatMap(([key, value]) => [`--${key}`, String(value)])

    const child = spawn("podman", ["machine", "init", "--rootful", "--now", ...resourceOpts])
    child.once("error", reject)

    // todo capture and return to UI
    child.stderr.pipe(process.stderr)
    child.stdout.pipe(process.stdout)

    child.once("exit", (code) => {
      if (code === 0) {
        resolve(true)
      } else {
        reject(new Error("Failed to initialize podman machine"))
      }
    })
  })
}

export default async function checkPodman() {
  await installPodmanCliIfNeeded()
  const execPromise = promisify(exec)

  const machine = await getPodmanMachine()
  if (!machine) {
    await initMachine()
  } else {
    let needsStart = machine.State !== "running"

    if (!machine.Rootful) {
      console.log("Stopping podman machine")
      await execPromise("podman machine stop")
      needsStart = true

      console.log("Converting podman machine to run in rootful mode")
      await execPromise("podman machine set --rootful")
    }

    if (machine.Resources.Memory < resources.memory) {
      console.log("Stopping podman machine")
      await execPromise("podman machine stop")
      needsStart = true

      console.log(`Updating podman machine memory to ${resources.memory}`)
      await execPromise(`podman machine set --memory ${resources.memory}`)
    }

    if (needsStart) {
      await execPromise(`podman machine start`)
    }
  }

  console.log("podman machine good to go")
}
