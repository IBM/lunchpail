import type Props from "../Props"
import { singular } from "../../name"
import { yamlFromSpec } from "../New/yaml"

import DeleteResourceButton from "@jaas/components/DeleteResourceButton"

/** Button/Action: Delete this resource */
export default function deleteAction(props: Props) {
  return (
    <DeleteResourceButton
      key="delete"
      kind="applications"
      singular={singular}
      yaml={yamlFromSpec(props.application)}
      name={props.application.metadata.name}
      namespace={props.application.metadata.namespace}
      context={props.application.metadata.context}
    />
  )
}
