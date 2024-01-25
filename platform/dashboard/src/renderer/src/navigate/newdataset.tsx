import LinkToNewWizard, { type WizardProps, linkerButtonProps } from "./wizard"

import { singular as datasetsSingular } from "@jaas/resources/datasets/name"

import type LocationProps from "./LocationProps"

/**
 * @return a UI component that links to the `NewWorkerPoolWizard`. If
 * `startOrAdd` is `start`, then present the UI as if this were the
 * first time we were asking to process the given `taskqueue`;
 * otherwise, present as if we are augmenting existing computational
 * resources.
 */
export function LinkToNewDataSet(
  props: WizardProps & {
    action?: "register" | "create"
    namespace: string
  },
) {
  const linkText = `Register ${datasetsSingular}`
  const qs = [`action=${props.action ?? "register"}`, `namespace=${props.namespace}`]

  return <LinkToNewWizard {...props} kind="datasets" linkText={linkText} qs={qs} />
}

export function buttonPropsForNewDataSet(
  location: Omit<LocationProps, "navigate">,
  props: WizardProps & {
    action?: "register" | "create"
    namespace: string
  },
) {
  const linkText = `Register ${datasetsSingular}`
  const qs = [`action=${props.action ?? "register"}`, `namespace=${props.namespace}`]

  return linkerButtonProps(location, {
    kind: "datasets",
    linkText,
    qs,
  })
}
