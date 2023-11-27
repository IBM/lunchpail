import type Props from "../Props"
import LinkToNewWizard from "@jay/renderer/navigate/wizard"

import { singular as workdispatcherSingular } from "@jay/resources/workdispatchers/name"

/** Button/Action: Allocate WorkDispatcher */
export default function NewWorkDispatcherButton(
  props: Props & {
    onClick?: () => void
    isInline?: boolean
    queueProps: import("@jay/resources/taskqueues/components/Props").default
  },
) {
  const qs = [
    `application=${props.application.metadata.name}`,
    `taskqueue=${props.queueProps.name}`,
    `namespace=${props.application.metadata.namespace}`,
  ]

  return (
    <LinkToNewWizard
      key="new-work-dispatcher"
      isInline={props.isInline}
      onClick={props.onClick}
      startOrAdd={props.isInline ? "create" : "start"}
      kind="workdispatchers"
      linkText={props.isInline ? `Configure ${workdispatcherSingular}` : "Dispatch Tasks"}
      qs={qs}
    />
  )
}
