/* eslint-disable @typescript-eslint/ban-ts-comment */

import apply from "./apply"
import createKindClusterIfNeeded from "./kind"

import type Action from "./action"
import type { ApplyProps } from "./apply"

type Config = "lite" | "full"

/** Install/delete the core from the control plane */
async function applyCore(config: Config, props: ApplyProps) {
  const { default: coreYaml } = await (config === "lite"
    ? // @ts-ignore
      import("../../../resources/jaas-lite.yml?raw")
    : // @ts-ignore
      import("../../../resources/jaas-full.yml?raw"))

  return apply(coreYaml, props)
}

/** Install/delete the examples from the control plane */
async function applyExamples(props: ApplyProps) {
  // @ts-ignore
  const { default: examplesYaml } = await import("../../../resources/jaas-examples.yml?raw")

  return apply(examplesYaml, props)
}

/** Install/delete all of the requested control plane components */
async function applyAll(config: Config, props: ApplyProps) {
  if (props.action === "delete") {
    await applyExamples(props)
    await applyCore(config, props)
  } else {
    await applyCore(config, props)
    await applyExamples(props)
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
