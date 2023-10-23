/* eslint-disable @typescript-eslint/ban-ts-comment */

import createKindClusterIfNeeded from "./kind"
import apply, { deleteJaaSManagedResources, restartControllers } from "./apply"

import type Action from "./action"
import type { ApplyProps } from "./apply"

type Config = "lite" | "full"

/** Install/delete the core from the control plane */
async function core(config: Config) {
  const { default: yaml } = await (config === "lite"
    ? // @ts-ignore
      import("../../../resources/jaas-lite.yml?raw")
    : // @ts-ignore
      import("../../../resources/jaas-full.yml?raw"))

  return yaml
}

/** Install/delete the defaults from the control plane */
async function defaults() {
  // @ts-ignore
  const { default: yaml } = await import("../../../resources/jaas-defaults.yml?raw")

  return yaml
}

/** Install/delete the examples from the control plane */
async function examples() {
  // @ts-ignore
  const { default: yaml } = await import("../../../resources/jaas-examples.yml?raw")

  return yaml
}

/** Install/delete all of the requested control plane components */
async function applyAll(config: Config, props: ApplyProps) {
  const yamls = await Promise.all([core(config), defaults(), examples()])

  if (props.action === "delete") {
    // we need to unwind things in the reverse order we applied them
    yamls.reverse()
    await deleteJaaSManagedResources(props)
  }

  for await (const yaml of yamls) {
    await apply(yaml, props)
  }

  if (props.action === "update") {
    await restartControllers(props)
  }

  await props.kubeconfig.cleanup()
}

/**
 * Initialize or destroy (based on the given `action`) the control
 * plane with the given `config`.
 */
export default async function manageControlPlane(config: Config, action: Action) {
  const { kubeconfig } = await createKindClusterIfNeeded()
  await applyAll(config, { kubeconfig, action })
}
