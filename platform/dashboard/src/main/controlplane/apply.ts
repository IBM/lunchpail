import { file } from "tmp-promise"
import { promisify } from "node:util"
import { exec } from "node:child_process"

import type Action from "./action"
import type { FileResult } from "tmp-promise"

export type ApplyProps = { action: Action; kubeconfig: Pick<FileResult, "path">; cluster?: string }

/** Context and cluster options for kubectl command line */
function clusterOpts(props: ApplyProps) {
  return ["--kubeconfig", props.kubeconfig.path, ...(props.cluster ? ["--cluster", props.cluster] : [])]
}

/**
 * Perform a Kubernetes apply of the given yaml against the given
 * props.kubeconfig
 */
export default async function apply(yaml: string, props: ApplyProps) {
  const execPromise = promisify(exec)
  const { writeFile } = await import("node:fs/promises")

  const yamlFile = await file()
  await writeFile(yamlFile.path, yaml)

  const ok = await execPromise(
    `kubectl ${props.action === "update" ? "apply" : props.action} ${clusterOpts(props).join(" ")} -f ${yamlFile.path}`,
  )
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

/**
 * Delete Kubernetes resources labeled with
 * app.kubernetes.io/managed-by=jaas
 */
export async function deleteJaaSManagedResources(props: ApplyProps) {
  const execPromise = promisify(exec)

  await Promise.all(
    ["workdispatchers", "platformreposecrets", "secrets"].flatMap(async (kind) => {
      const resources = await execPromise(
        `kubectl get ${clusterOpts(props).join(
          " ",
        )} ${kind} -A --ignore-not-found -o custom-columns=NAME:.metadata.name,NAMESPACE:.metadata.namespace --no-headers`,
      )
        .then((resp) => {
          const resources: [string, string][] = resp.stdout
            .trim()
            .split(/\n/)
            .map((line) => {
              const fields = line.split(/\s+/)
              return [fields[0], fields[1]] // name, namespace
            })
          return resources
        })
        .catch((err) => {
          console.error(err)
          return [] as [string, string][]
        })

      return Promise.all(
        resources.map(([name, ns]) =>
          execPromise(
            `kubectl delete ${clusterOpts(props).join(" ")} ${kind} ${name} ${ns === "<none>" ? "" : "-n " + ns}`,
          )
            .then((resp) => {
              console.log(resp)
              return true
            })
            .catch((err) => {
              console.error(err)
              return false
            }),
        ),
      )
    }),
  )
}

/** Wait for our namespaces to go away */
export async function waitForNamespaceTermination(props: ApplyProps, component: "core" | "noncore") {
  const execPromise = promisify(exec)
  await execPromise(
    `kubectl wait ns ${clusterOpts(props).join(
      " ",
    )} -l app.kubernetes.io/managed-by=codeflare.dev,app.kubernetes.io/component=${component} --for=delete --timeout=240s`,
  )
}

export async function restartControllers(props: ApplyProps) {
  const execPromise = promisify(exec)
  await execPromise(
    `kubectl rollout restart deployment -n codeflare-system ${clusterOpts(props).join(
      " ",
    )} -l app.kubernetes.io/part-of=codeflare.dev,app.kubernetes.io/component=controller`,
  )
}
