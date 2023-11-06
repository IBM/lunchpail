import { LinkToNewPool } from "@jay/renderer/navigate/newpool"
import { type WizardProps } from "@jay/renderer/navigate/wizard"

export function LinkToNewWorkerPool(props: Pick<WizardProps, "startOrAdd">) {
  return <LinkToNewPool startOrAdd={props.startOrAdd ?? "create"} />
}
