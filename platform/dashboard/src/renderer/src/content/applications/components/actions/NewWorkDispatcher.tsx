import type Props from "../Props"
import LinkToNewWizard from "@jay/renderer/navigate/wizard"

/** Button/Action: Allocate WorkDispatcher */
export default function NewWorkDispatcherButton(
  props: Props & { queueProps: import("../../../taskqueues/components/Props").default },
) {
  const qs = [
    `application=${props.application.metadata.name}`,
    `taskqueue=${props.queueProps.name}`,
    `namespace=${props.application.metadata.namespace}`,
  ]
  return (
    <LinkToNewWizard
      key="new-work-dispatcher"
      startOrAdd="start"
      kind="workdispatchers"
      linkText="Queue up Tasks"
      qs={qs}
    />
  )
}
