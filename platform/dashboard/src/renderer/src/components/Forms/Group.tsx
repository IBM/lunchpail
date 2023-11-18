import { FormGroup, FormHelperText, HelperText, HelperTextItem } from "@patternfly/react-core"

import type { GroupProps } from "./Props"

import "./Forms.scss"

export default function Group(props: GroupProps) {
  return (
    <FormGroup
      isRequired={props.isRequired ?? true}
      label={props.label}
      fieldId={props.fieldId}
      labelInfo={props.labelInfo}
      data-has-pointer-events="true"
    >
      {props.children}

      {props.description && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem>{props.description}</HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
    </FormGroup>
  )
}
