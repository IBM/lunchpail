import LinkToNewWizard from "@jaas/renderer/navigate/wizard"

import type Props from "@jaas/resources/runs/components/Props"
import { singular as workdispatcher } from "@jaas/resources/workdispatchers/name"

/** Button/Action: Allocate WorkDispatcher */
export default function NewWorkDispatcherButton(
  props: Props & {
    onClick?: () => void
    isInline?: boolean
    queueProps: import("@jaas/resources/taskqueues/components/Props").default
  },
) {
  const qs = [`run=${props.run.metadata.name}`, `namespace=${props.run.metadata.namespace}`]

  return (
    <LinkToNewWizard
      key="new-work-dispatcher"
      isInline={props.isInline}
      onClick={props.onClick}
      startOrAdd={props.isInline ? "create" : "start"}
      kind="workdispatchers"
      linkText={props.isInline ? `Configure ${workdispatcher}` : `Create ${workdispatcher}`}
      qs={qs}
    />
  )
}
