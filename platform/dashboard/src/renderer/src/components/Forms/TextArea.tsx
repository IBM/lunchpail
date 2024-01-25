import { useCallback } from "react"
import Code, { type SupportedLanguage } from "@jaas/components/Code"
import { TextArea as PFTextArea, type TextAreaProps } from "@patternfly/react-core"

import Group from "./Group"
import type { Ctrl, FormProps } from "./Props"

/** A text area form element */
export default function TextArea(
  props: FormProps & TextAreaProps & Ctrl & { language?: SupportedLanguage; showLineNumbers?: boolean },
) {
  const onChange = useCallback(
    (_, value: string) => props.ctrl.setValue(props.fieldId, value),
    [props.ctrl.setValue, props.fieldId],
  )

  const onChangeForCode = useCallback(
    (value: string) => props.ctrl.setValue(props.fieldId, value),
    [props.ctrl.setValue, props.fieldId],
  )

  const value = props.ctrl.values[props.fieldId] || props.value

  // if `props.language` is given, then we present the value as
  // <Code/> otherwise we use a plain <TextArea/>
  return (
    <Group {...props}>
      {props.language ? (
        <Code language={props.language} showLineNumbers={props.showLineNumbers ?? false} onChange={onChangeForCode}>
          {value === undefined ? "" : String(value)}
        </Code>
      ) : (
        <PFTextArea rows={props.rows} aria-label={`${props.fieldId} text area`} value={value} onChange={onChange} />
      )}
    </Group>
  )
}
