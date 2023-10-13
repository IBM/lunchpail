/* eslint-disable @typescript-eslint/ban-ts-comment */

import { file } from "tmp-promise"
import { promisify } from "node:util"
import { exec } from "node:child_process"

import type { FileResult } from "tmp-promise"

type Config = "lite" | "full"
type Action = "apply" | "delete"
type InstallProps = { config: Config; clusterName: string; kubeconfig: FileResult; action: Action }

function installKindIfNeeded() {
  // TODO
}

async function createKindClusterIfNeeded(clusterName = "codeflare-platform") {
  // TODO
  const execPromise = promisify(exec)
  const kubeconfig = await file()

  await execPromise(`kind export kubeconfig -n ${clusterName} --kubeconfig ${kubeconfig.path}`)

  return {
    clusterName,
    kubeconfig,
  }
}

async function applyCore(props: InstallProps) {
  const { default: core } = await (props.config === "lite"
    ? // @ts-ignore
      import("../../../resources/jaas-lite.yml?raw")
    : // @ts-ignore
      import("../../../resources/jaas-full.yml?raw"))

  const execPromise = promisify(exec)
  const { writeFile } = await import("node:fs/promises")

  const coreFile = await file()
  await writeFile(coreFile.path, core)

  const ok = await execPromise(`kubectl ${props.action} --kubeconfig ${props.kubeconfig.path} -f ${coreFile.path}`)
    .then((resp) => {
      console.log(resp)
      return true
    })
    .catch((err) => {
      console.error(err)
      return false
    })

  await coreFile.cleanup()

  return ok
}

async function applyExamples(props: InstallProps) {
  // @ts-ignore
  const { default: examples } = await import("../../../resources/jaas-examples.yml?raw")

  // console.log("Got core", core)
  // console.log("Got kubeconfig", props.kubeconfig)

  const execPromise = promisify(exec)
  const { writeFile } = await import("node:fs/promises")

  const examplesFile = await file()
  await writeFile(examplesFile.path, examples)

  const ok = await execPromise(`kubectl ${props.action} --kubeconfig ${props.kubeconfig.path} -f ${examplesFile.path}`)
    .then((resp) => {
      console.log(resp)
      return true
    })
    .catch((err) => {
      console.error(err)
      return false
    })

  await examplesFile.cleanup()
  return ok
}

async function apply(props: InstallProps) {
  if (props.action === "delete") {
    await applyExamples(props)
    await applyCore(props)
  } else {
    await applyCore(props)
    await applyExamples(props)
  }

  await props.kubeconfig.cleanup()
}

export default async function manageControlPlane(config: Config, action: Action) {
  await installKindIfNeeded()
  const { clusterName, kubeconfig } = await createKindClusterIfNeeded()
  await apply({ config, clusterName, kubeconfig, action })
}
