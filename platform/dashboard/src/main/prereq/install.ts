/* eslint-disable @typescript-eslint/ban-ts-comment */

import { file } from "tmp-promise"
import { promisify } from "node:util"
import { exec } from "node:child_process"

import type { FileResult } from "tmp-promise"

type Config = "lite" | "full"
type Action = "apply" | "delete"

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

async function apply(props: { config: Config; clusterName: string; kubeconfig: FileResult; action: Action }) {
  const { default: core } = await (props.config === "lite"
    ? // @ts-ignore
      import("../../../resources/jaas-lite.yml?raw")
    : // @ts-ignore
      import("../../../resources/jaas-full.yml?raw"))

  // @ts-ignore
  const { default: examples } = await import("../../../resources/jaas-examples.yml?raw")

  console.log("Got core", core)
  console.log("Got kubeconfig", props.kubeconfig)

  const execPromise = promisify(exec)
  const { writeFile } = await import("node:fs/promises")

  const coreFile = await file()
  await writeFile(coreFile.path, core)

  const examplesFile = await file()
  await writeFile(examplesFile.path, examples)

  const okCore = await execPromise(`kubectl ${props.action} --kubeconfig ${props.kubeconfig.path} -f ${coreFile.path}`)
    .then((resp) => {
      console.log(resp)
      return true
    })
    .catch((err) => {
      console.error(err)
      return false
    })

  const okExamples = await execPromise(
    `kubectl ${props.action} --kubeconfig ${props.kubeconfig.path} -f ${examplesFile.path}`,
  )
    .then((resp) => {
      console.log(resp)
      return true
    })
    .catch((err) => {
      console.error(err)
      return false
    })

  console.log("OK core", okCore)
  console.log("OK examples", okExamples)

  await Promise.all([coreFile.cleanup(), examplesFile.cleanup(), props.kubeconfig.cleanup()])
}

export default async function manageControlPlane(config: Config, action: Action) {
  await installKindIfNeeded()
  const { clusterName, kubeconfig } = await createKindClusterIfNeeded()
  await apply({ config, clusterName, kubeconfig, action })
}
