import LinkToNewWizard, { isShowingTask } from "./wizard"

import type { WizardProps } from "./wizard"
import type { LocationProps } from "../router/withLocation"

const task = "newreposecret"

export default function isShowingNewRepoSecret(props: Pick<LocationProps, "searchParams">) {
  return isShowingTask(task, props)
}

/**
 * @return a UI component that links to the `NewWorkerPoolWizard`. If
 * `startOrAdd` is `start`, then present the UI as if this were the
 * first time we were asking to process the given `dataset`;
 * otherwise, present as if we are augmenting existing computational
 * resources.
 */
export function LinkToNewRepoSecret(
  props: WizardProps & {
    repo?: string
    namespace: string
  },
) {
  const linkText = props.startOrAdd === "fix" ? "Add Repo Secret" : "Create Repo Secret"
  const qs = [`namespace=${props.namespace}`].filter(Boolean)
  if (props.repo) {
    qs.push(`repo=${props.repo}`)
  }

  return <LinkToNewWizard {...props} task={task} linkText={linkText} qs={qs} />
}
