import { useCallback, useState } from "react"
import { NumberInput as PFNumberInput } from "@patternfly/react-core"

import Group from "./Group"
import type { Ctrl, FormProps } from "./Props"

/** A number input form element */
export default function NumberInput(props: FormProps & Ctrl & { defaultValue?: number; min?: number; max?: number }) {
  const [value, setValue] = useState<number | "">(props.defaultValue !== undefined ? props.defaultValue : 1)

  const onChange = useCallback(
    (evt: React.FormEvent<HTMLInputElement>) => {
      props.ctrl.setValue(props.fieldId, evt.currentTarget.value)
    },
    [props.ctrl.setValue, props.fieldId],
  )

  const onClick = (incr: number) =>
    useCallback(() => {
      const newValue = (value as number) + incr
      props.ctrl.setValue(props.fieldId, newValue.toString())
      setValue(newValue)
    }, [props.ctrl.setValue, props.fieldId, setValue])
  const onMinus = onClick(-1)
  const onPlus = onClick(+1)

  return (
    <Group {...props}>
      <PFNumberInput
        value={value}
        min={props.min ?? 0}
        max={props.max}
        onMinus={onMinus}
        onPlus={onPlus}
        onChange={onChange}
      />
    </Group>
  )
}
