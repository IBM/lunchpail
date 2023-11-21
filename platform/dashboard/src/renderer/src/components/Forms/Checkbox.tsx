import { useCallback } from "react"
import { Checkbox as PFCheckbox, type CheckboxProps } from "@patternfly/react-core"

import Group from "./Group"
import type { Ctrl, FormProps } from "./Props"

/** A checkbox form element */
export default function Checkbox(
  props: FormProps & Omit<CheckboxProps, "id"> & Ctrl & { onToggle?: (value: boolean) => void },
) {
  const onChange = useCallback(
    (_, value: boolean) => {
      props.ctrl.setValue(props.fieldId, String(value))
      if (props.onToggle) {
        props.onToggle(value)
      }
    },
    [props.ctrl.setValue, props.fieldId],
  )

  return (
    <Group {...props}>
      <PFCheckbox
        id={props.fieldId}
        name={props.fieldId}
        isDisabled={props.isDisabled}
        isChecked={props.ctrl.values[props.fieldId] === "true"}
        onChange={onChange}
      />
    </Group>
  )
}
