import LinkToNewWizard, { type WizardProps } from "@jay/renderer/navigate/wizard"

import { singular as datasetsSingular } from "@jay/resources/datasets/name"

type Props = Pick<WizardProps, "startOrAdd" | "isInline"> & {
  action?: "create" | "register"
  namespace?: string
  onClick?: () => void
}

export function LinkToNewDataSet(props: Props) {
  const qs: string[] = []
  if (props.action) {
    qs.push(`action=${props.action}`)
  }
  if (props.namespace) {
    qs.push(`namespace=${props.namespace}`)
  }

  const name = datasetsSingular
  const linkText = `New ${name}`

  return (
    <LinkToNewWizard
      isInline={props.isInline}
      onClick={props.onClick}
      startOrAdd={props.startOrAdd ?? "create"}
      kind="datasets"
      linkText={linkText}
      qs={qs}
    />
  )
}
