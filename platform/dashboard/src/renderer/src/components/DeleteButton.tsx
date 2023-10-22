import type { MouseEvent } from "react"
import { Button } from "@patternfly/react-core"

import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon"

function onClick(evt: MouseEvent) {
  const kind = evt.currentTarget.getAttribute("data-kind")
  const name = evt.currentTarget.getAttribute("data-name")
  const namespace = evt.currentTarget.getAttribute("data-namespace")

  if (kind && name && namespace) {
    window.jay.delete({ kind, name, namespace })
  }
}

export default function DeleteButton(props: import("@jay/common/api/jay").DeleteProps) {
  return (
    <Button
      size="sm"
      key="delete"
      variant="danger"
      icon={<TrashIcon />}
      data-kind={props.kind}
      data-name={props.name}
      data-namespace={props.namespace}
      onClick={onClick}
    >
      Delete
    </Button>
  )
}
