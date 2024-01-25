import { singular } from "../../name"
import LinkToNewWizard, { type WizardProps } from "@jaas/renderer/navigate/wizard"

type Props = Pick<WizardProps, "startOrAdd"> & {
  namespace?: string
}

export function LinkToNewComputeTarget(props: Props) {
  const qs: string[] = []
  if (props.namespace) {
    qs.push(`namespace=${props.namespace}`)
  }
  return (
    <LinkToNewWizard
      startOrAdd={props.startOrAdd ?? "create"}
      kind="computetargets"
      linkText={`New ${singular}`}
      qs={qs}
    />
  )
}
