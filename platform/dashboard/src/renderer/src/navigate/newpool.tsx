import LinkToNewWizard, { type WizardProps } from "./wizard"
import { name as workerpoolName, singular as workerpoolSingular } from "../content/workerpools/name"

/**
 * @return a UI component that links to the `NewWorkerPoolWizard`. If
 * `startOrAdd` is `start`, then present the UI as if this were the
 * first time we were asking to process the given `taskqueue`;
 * otherwise, present as if we are augmenting existing computational
 * resources.
 */
export function LinkToNewPool(
  props: WizardProps & {
    taskqueue?: string
  },
) {
  const linkText =
    props.startOrAdd === "start"
      ? "Allocate " + workerpoolName
      : props.startOrAdd === "add"
      ? "Add " + workerpoolName
      : "Create " + workerpoolSingular
  const qs = [props.taskqueue ? `taskqueue=${props.taskqueue}` : ""]

  return <LinkToNewWizard {...props} kind="workerpools" linkText={linkText} qs={qs} />
}
