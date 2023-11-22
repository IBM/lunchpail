import type Props from "../Props"
import { singular } from "../../name"
import { yamlFromSpec } from "../New/yaml"

import DeleteResourceButton from "@jay/components/DeleteResourceButton"

/** Button/Action: Delete this resource */
export default function deleteAction(props: Props) {
  return (
    <DeleteResourceButton
      singular={singular}
      kind="tasksimulators.codeflare.dev"
      yaml={yamlFromSpec(props.workdispatcher)}
      name={props.workdispatcher.metadata.name}
      namespace={props.workdispatcher.metadata.namespace}
    />
  )
}