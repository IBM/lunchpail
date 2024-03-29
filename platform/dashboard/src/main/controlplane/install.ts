/* eslint-disable @typescript-eslint/ban-ts-comment */

import createKindClusterIfNeeded from "./kind"
import apply, { deleteJaaSManagedResources, restartControllers, waitForNamespaceTermination } from "./apply"

import type Action from "./action"
import type { ApplyProps } from "./apply"

type Config = "lite"

/** Install/delete the core from the control plane */
async function core(/* config: Config */) {
  // @ts-ignore
  const { default: yaml } = await import("../../../resources/02-jaas.yml?raw")

  return yaml
}

/** Install/delete the pre requisites from the control plane */
async function prereq1() {
  // @ts-ignore
  const { default: yaml } = await import("../../../resources/01-jaas-prereqs1.yml?raw")

  return yaml
}

/** Install/delete the defaults from the control plane */
async function defaults() {
  // @ts-ignore
  const { default: yaml } = await import("../../../resources/04-jaas-defaults.yml?raw")

  return yaml
}

/** Install/delete all of the requested control plane components */
async function applyAll(_config: Config, props: ApplyProps) {
  const coreYamls = await Promise.all([prereq1(), core()])
  const noncoreYamls = await Promise.all([defaults()])
  const coreYamlsReversed = coreYamls.toReversed()
  const noncoreYamlsReversed = noncoreYamls.toReversed()

  if (props.action === "delete") {
    await deleteJaaSManagedResources(props)

    // we need to unwind things in the reverse order we applied them
    for await (const yaml of noncoreYamlsReversed) {
      await apply(yaml, props)
    }
    await waitForNamespaceTermination(props, "noncore")

    for await (const yaml of coreYamlsReversed) {
      await apply(yaml, props)
    }
    await waitForNamespaceTermination(props, "core")
  } else {
    for await (const yaml of coreYamls) {
      await apply(yaml, props)
    }
    for await (const yaml of noncoreYamls) {
      await apply(yaml, props)
    }

    await restartControllers(props)
  }
}

/**
 * Initialize or destroy (based on the given `action`) the control
 * plane with the given `config`.
 */
export default async function manageControlPlane(
  config: Config,
  action: Action,
  cluster: string,
  dryRun = false,
  provisionRuntime = true,
) {
  await createKindClusterIfNeeded(cluster.replace(/^kind-/, ""), action, dryRun)

  if (!dryRun && provisionRuntime) {
    await applyAll(config, { action, cluster })
  }
}
