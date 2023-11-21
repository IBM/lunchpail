import { useCallback } from "react"
import { TextArea as PFTextArea, type TextAreaProps } from "@patternfly/react-core"

import Group from "./Group"
import type { Ctrl, FormProps } from "./Props"

/** A text area form element */
export default function TextArea(props: FormProps & TextAreaProps & Ctrl) {
  const onChange = useCallback(
    (_, value: string) => props.ctrl.setValue(props.fieldId, value),
    [props.ctrl.setValue, props.fieldId],
  )

  return (
    <Group {...props}>
      <PFTextArea
        rows={props.rows}
        aria-label={`${props.fieldId} text area`}
        value={props.ctrl.values[props.fieldId] ?? ""}
        onChange={onChange}
      />
    </Group>
  )
}
