import LinkToNewWizard, { type WizardProps } from "./wizard"

/**
 * @return a UI component that links to the `NewWorkerPoolWizard`. If
 * `startOrAdd` is `start`, then present the UI as if this were the
 * first time we were asking to process the given `taskqueue`;
 * otherwise, present as if we are augmenting existing computational
 * resources.
 */
export function LinkToNewPool(
  props: WizardProps & {
    run?: string
    namespace?: string
  },
) {
  const verb = "Add"
  const linkText = `${verb} Compute`
  const qs: string[] = []

  if (props.run) {
    qs.push(`run=${props.run}`)
  }
  if (props.namespace) {
    qs.push(`namespace=${props.namespace}`)
  }

  return <LinkToNewWizard {...props} kind="workerpools" linkText={linkText} qs={qs} />
}
