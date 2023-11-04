import { singular } from "../../../names"
import LinkToNewWizard, { type WizardProps } from "../../../navigate/wizard"

type Props = Pick<WizardProps, "startOrAdd"> & {
  action?: "create" | "register"
  namespace?: string
}

export function LinkToNewDataSet(props: Props) {
  const qs: string[] = [`action=${props.action}`]
  if (props.namespace) {
    qs.push(`namespace=${props.namespace}`)
  }

  const name = singular.datasets
  const linkText = props.action === "create" ? `Create ${name}` : `Register ${name}`

  return <LinkToNewWizard startOrAdd={props.startOrAdd ?? "create"} kind="datasets" linkText={linkText} qs={qs} />
}
