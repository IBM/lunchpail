import { singular } from "../../name"
import type NameProps from "@jaas/components/NameProps"
import DeleteResourceButton from "@jaas/components/DeleteResourceButton"

/** Delete this resource */
export default function deleteAction({ name, namespace, context }: NameProps) {
  return (
    <DeleteResourceButton
      key="delete"
      singular={singular}
      kind="workerpools"
      name={name}
      namespace={namespace}
      context={context}
    />
  )
}
