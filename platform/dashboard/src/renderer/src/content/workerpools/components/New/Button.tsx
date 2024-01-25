import { LinkToNewPool } from "@jaas/renderer/navigate/newpool"
import { type WizardProps } from "@jaas/renderer/navigate/wizard"

export function LinkToNewWorkerPool(props: Pick<WizardProps, "startOrAdd">) {
  return <LinkToNewPool startOrAdd={props.startOrAdd ?? "create"} />
}
