import { singular as application } from "../../name"
import LinkToNewWizard, { type WizardProps } from "@jaas/renderer/navigate/wizard"

type Props = Pick<WizardProps, "startOrAdd"> & {
  namespace?: string
}

export function LinkToNewApplication(props: Props) {
  const qs: string[] = []
  if (props.namespace) {
    qs.push(`namespace=${props.namespace}`)
  }
  return (
    <LinkToNewWizard
      startOrAdd={props.startOrAdd ?? "create"}
      kind="applications"
      linkText={`New ${application}`}
      qs={qs}
    />
  )
}
