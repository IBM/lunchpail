import indent from "@jay/common/util/indent"

import type Values from "./Values"
import type { Context } from "./Wizard"
import type { KubeConfig } from "@jay/common/api/kubernetes"

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
  const applicationSpec = context.applications.find((_) => _.metadata.name === values.application)
  if (!applicationSpec) {
    console.error("Internal error: Application spec not found", values.application, values, context.applications)
    // TODO how do we report this to the UI?
  }

  // TODO re: internal-error
  const namespace = applicationSpec ? applicationSpec.metadata.namespace : "internal-error"

  // fetch kubeconfig
  const kubeconfig =
    !values.target || !window.jay.contexts
      ? undefined
      : await window.jay
          .contexts()
          .then(({ config }) =>
            btoa(
              JSON.stringify(stripKubeconfig(config, values.target)).replace(/127\.0\.0\.1/g, "host.docker.internal"),
            ),
          )

  // details for the target
  const target = values.target
    ? `
target:
  kubernetes:
    context: ${values.target}
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
  dataset: ${values.taskqueue}
  application:
    name: ${values.application}
  workers:
    count: ${values.count}
    size: ${values.size}
    supportsGpu: ${values.supportsGpu}
${indent(target, 2)}
`.trim()
}
