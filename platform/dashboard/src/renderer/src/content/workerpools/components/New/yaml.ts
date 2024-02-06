import indent from "@jaas/common/util/indent"

import type Values from "./Values"
import type Context from "./Context"
import type { KubeConfig } from "@jaas/common/api/kubernetes"

/**
 * Strip `config` to allow access only to the given `context`.
 */
function stripKubeconfig(config: KubeConfig, context: string): KubeConfig {
  const configObj = config.contexts.find((_) => _.name === context)
  if (!configObj) {
    // TODO report to user
    console.error("Cannot find given context in given config", context, config)
    return config
  }

  return Object.assign({}, config, {
    contexts: config.contexts.filter((_) => _.name === context),
    users: config.users.filter((_) => _.name === configObj.context.user),
    clusters: config.clusters.filter((_) => _.name === configObj.context.cluster),
  })
}

/**
 * Generate the yaml spec for the new `WorkerPool` resource.
 */
export default async function yaml(values: Values["values"], context: Context) {
  const run = context.runs.find((_) => _.metadata.name === values.run)
  if (!run) {
    console.error(`Internal error: Run not found '${values.run}'`, values, context.runs)
    // TODO how do we report this to the UI?
  }

  // TODO re: internal-error
  const namespace = run ? run.metadata.namespace : "internal-error"

  // fetch kubeconfig
  const kubeconfig =
    !values.context || !window.jaas.contexts
      ? undefined
      : await window.jaas.contexts().then(({ config }) => btoa(JSON.stringify(stripKubeconfig(config, values.context))))

  // details for the target
  const target = values.context
    ? `
target:
  kubernetes:
    context: ${values.context}
    config:
      value: ${kubeconfig}
`.trim()
    : ""

  return `
apiVersion: codeflare.dev/v1alpha1
kind: WorkerPool
metadata:
  name: ${values.name}
  namespace: ${namespace}
spec:
  run:
    name: ${values.run}
  workers:
    count: ${values.count}
    size: ${values.size}
    supportsGpu: ${values.supportsGpu}
${indent(target, 2)}
`.trim()
}
