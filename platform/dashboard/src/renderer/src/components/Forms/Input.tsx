import { useCallback } from "react"
import { TextInput, type TextInputProps } from "@patternfly/react-core"

import Group from "./Group"
import type { Ctrl, FormProps } from "./Props"

/** A text input form element */
export default function Input(
  props: FormProps & Pick<TextInputProps, "type" | "readOnlyVariant" | "customIcon"> & Ctrl,
) {
  const onChange = useCallback(
    (_, value: string) => props.ctrl.setValue(props.fieldId, value),
    [props.ctrl.setValue, props.fieldId],
  )

  return (
    <Group {...props}>
      <TextInput
        isRequired
        type={props.type ?? "text"}
        readOnlyVariant={props.readOnlyVariant}
        customIcon={props.customIcon}
        aria-label={`${props.fieldId} text input`}
        name={props.fieldId}
        aria-describedby={`${props.fieldId}-helper`}
        value={props.ctrl.values[props.fieldId] ?? ""}
        onChange={onChange}
      />
    </Group>
  )
}
