import DeleteResourceButton from "@jaas/components/DeleteResourceButton"

import type Props from "../Props"
import { singular as run } from "../../name"

/** Button/Action: Delete this resource */
export default function deleteAction(props: Pick<Props, "run">) {
  return (
    <DeleteResourceButton
      key="delete"
      kind="runs"
      singular={run}
      name={props.run.metadata.name}
      namespace={props.run.metadata.namespace}
      context={props.run.metadata.context}
    />
  )
}
