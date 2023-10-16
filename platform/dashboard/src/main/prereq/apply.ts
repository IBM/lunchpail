import { file } from "tmp-promise"
import { promisify } from "node:util"
import { exec } from "node:child_process"

import type Action from "./action"
import type { FileResult } from "tmp-promise"

export type ApplyProps = { action: Action; kubeconfig: FileResult }

export default async function apply(yaml: string, props: ApplyProps) {
  const execPromise = promisify(exec)
  const { writeFile } = await import("node:fs/promises")

  const yamlFile = await file()
  await writeFile(yamlFile.path, yaml)

  const ok = await execPromise(`kubectl ${props.action} --kubeconfig ${props.kubeconfig.path} -f ${yamlFile.path}`)
    .then((resp) => {
      console.log(resp)
      return true
    })
    .catch((err) => {
      console.error(err)
      return false
    })

  await yamlFile.cleanup()

  return ok
}
