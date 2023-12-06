import type Props from "../Props"
import { singular } from "../../name"
import { yamlFromSpec } from "../New/yaml"

import DeleteResourceButton from "@jay/components/DeleteResourceButton"

/** Button/Action: Delete this resource */
export default function deleteAction(props: Props) {
  return (
    <DeleteResourceButton
      key="delete"
      singular={singular}
      kind="applications.codeflare.dev"
      yaml={yamlFromSpec(props.application)}
      name={props.application.metadata.name}
      namespace={props.application.metadata.namespace}
    />
  )
}
