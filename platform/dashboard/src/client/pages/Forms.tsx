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
  const [selected, setSelected] = useState<string>(`Please select one`)

  if (props.ctrl.values[props.fieldId] && props.ctrl.values[props.fieldId] !== selected) {
    setSelected(props.ctrl.values[props.fieldId])
  }

  return (
    <Group {...props}>
      <PFSelect
        id={props.fieldId}
        isOpen={isOpen}
        aria-describedby={`${props.fieldId}-helper`}
        onOpenChange={(isOpen) => setIsOpen(isOpen)}
        selected={selected}
        onSelect={(evt, value) => {
          if (typeof value === "string") {
            props.ctrl.setValue(props.fieldId, value)
          }
          setSelected(value as string)
          setIsOpen(false)
        }}
        toggle={(ref) => (
          <MenuToggle
            ref={ref}
            onClick={() => setIsOpen(!isOpen)}
            isExpanded={isOpen}
            style={{
              width: "200px",
            }}
          >
            {selected}
          </MenuToggle>
        )}
      >
        <SelectList>
          {props.options.map((value) => (
            <SelectOption key={value} value={value}>
              {value}
            </SelectOption>
          ))}
        </SelectList>
      </PFSelect>
    </Group>
  )
}
