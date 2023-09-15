import { PropsWithChildren, useState } from "react"

import {
  FormContextProps,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  MenuToggle,
  Select as PFSelect,
  SelectOption,
  SelectList,
  TextInput,
} from "@patternfly/react-core"

type Ctrl = { ctrl: Pick<FormContextProps, "values" | "setValue"> }
type FormProps = { fieldId: string; label: string; description: string }
type GroupProps = PropsWithChildren<FormProps>

function Group(props: GroupProps) {
  return (
    <FormGroup isRequired label={props.label} fieldId={props.fieldId}>
      {props.children}
      <FormHelperText>
        <HelperText>
          <HelperTextItem>{props.description}</HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  )
}

export function Input(props: FormProps & Ctrl) {
  return (
    <Group {...props}>
      <TextInput
        isRequired
        type="text"
        id={props.fieldId}
        name={props.fieldId}
        aria-describedby={`${props.fieldId}-helper`}
        value={props.ctrl.values[props.fieldId]}
        onChange={(evt, value) => props.ctrl.setValue(props.fieldId, value)}
      />
    </Group>
  )
}

export function Select(props: FormProps & Ctrl & { options: string[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Group {...props}>
      <PFSelect
        id={props.fieldId}
        aria-describedby={`${props.fieldId}-helper`}
        selected={props.ctrl.values[props.fieldId]}
        onSelect={(evt, value) => typeof value === "string" && props.ctrl.setValue(props.fieldId, value)}
        toggle={(ref) => <MenuToggle ref={ref} onClick={() => setIsOpen(!isOpen)} isExpanded={isOpen} />}
      >
        <SelectList>
          {props.options.map((value) => (
            <SelectOption value={value}>{value}</SelectOption>
          ))}
        </SelectList>
      </PFSelect>
    </Group>
  )
}
