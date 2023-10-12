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
  const { default: yaml } = await (props.config === "lite"
    ? // @ts-ignore
      import("../../../resources/jaas-lite.yml?raw")
    : // @ts-ignore
      import("../../../resources/jaas-full.yml?raw"))

  console.log("Got yaml", yaml)
  console.log("Got kubeconfig", props.kubeconfig)

  const yamlFile = await file()
  const { writeFile } = await import("node:fs/promises")
  await writeFile(yamlFile.path, yaml)

  const execPromise = promisify(exec)
  console.log(await execPromise(`kubectl ${props.action} --kubeconfig ${props.kubeconfig.path} -f ${yamlFile.path}`))

  await Promise.all([yamlFile.cleanup(), props.kubeconfig.cleanup()])
}

export default async function manageControlPlane(config: Config, action: Action) {
  await installKindIfNeeded()
  const { clusterName, kubeconfig } = await createKindClusterIfNeeded()
  await apply({ config, clusterName, kubeconfig, action })
}
