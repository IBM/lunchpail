import { LinkToNewPool } from "../../../navigate/newpool"
import { type WizardProps } from "../../../navigate/wizard"

export function LinkToNewWorkerPool(props: Pick<WizardProps, "startOrAdd">) {
  return <LinkToNewPool startOrAdd={props.startOrAdd ?? "create"} />
}
