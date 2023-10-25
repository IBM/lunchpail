import LinkToNewWizard, { isShowingTask } from "./wizard"

import type { WizardProps } from "./wizard"

const task = "newpool"

export default function isShowingNewPool() {
  return isShowingTask(task)
}

/**
 * @return a UI component that links to the `NewWorkerPoolWizard`. If
 * `startOrAdd` is `start`, then present the UI as if this were the
 * first time we were asking to process the given `dataset`;
 * otherwise, present as if we are augmenting existing computational
 * resources.
 */
export function LinkToNewPool(
  props: WizardProps & {
    dataset?: string
  },
) {
  const linkText =
    props.startOrAdd === "start"
      ? "Assign Workers"
      : props.startOrAdd === "add"
      ? "Assign More Workers"
      : "Create Worker Pool"
  const qs = [props.dataset ? `dataset=${props.dataset}` : ""]

  return <LinkToNewWizard {...props} task={task} linkText={linkText} qs={qs} />
}
