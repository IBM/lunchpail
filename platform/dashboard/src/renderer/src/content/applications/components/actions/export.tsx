import { useCallback } from "react"
import { Tooltip, Button } from "@patternfly/react-core"

import type Props from "../Props"
import { yamlFromSpec } from "../New/yaml"

import ExportIcon from "@patternfly/react-icons/dist/esm/icons/cloud-download-alt-icon"

/** Button/Action: Export this resource */
export default function exportAction(props: Props) {
  const onClick = useCallback(() => navigator.clipboard.writeText(yamlFromSpec(props.application)), [props.application])
  return (
    <Tooltip content="Export this resource specification to the clipboard">
      <Button size="lg" variant="plain" onClick={onClick}>
        <ExportIcon />
      </Button>
    </Tooltip>
  )
}
