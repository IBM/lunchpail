import type { ReactNode } from "react"
import { FormGroup, FormHelperText, HelperText, HelperTextItem, Popover } from "@patternfly/react-core"

import "./Forms.scss"

import HelpIcon from "@patternfly/react-icons/dist/esm/icons/help-icon"

function popoverHelp(label: ReactNode, helpText: ReactNode) {
  return (
    <Popover headerContent={<div>{label} Help</div>} bodyContent={helpText}>
      <HelpIcon />
    </Popover>
  )
}

export default function Group(props: import("./Props").GroupProps) {
  return (
    <FormGroup
      isRequired={props.isRequired ?? true}
      label={props.label}
      fieldId={props.fieldId}
      labelInfo={props.labelInfo}
      labelIcon={props.helpText ? popoverHelp(props.label, props.helpText) : undefined}
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
