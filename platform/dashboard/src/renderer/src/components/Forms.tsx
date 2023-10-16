import { PropsWithChildren, ReactNode, useState } from "react"

import {
  FormContextProps,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  MenuToggle,
  NumberInput as PFNumberInput,
  Select as PFSelect,
  SelectOption,
  SelectOptionProps,
  SelectList,
  TextInput,
  TextInputProps,
} from "@patternfly/react-core"

type Ctrl = { ctrl: Pick<FormContextProps, "values" | "setValue"> }
type FormProps = { fieldId: string; label: string; description: string }
type GroupProps = PropsWithChildren<FormProps>

import "./Forms.scss"

function Group(props: GroupProps) {
  return (
    <FormGroup isRequired label={props.label} fieldId={props.fieldId} data-has-pointer-events="true">
      {props.children}
      <FormHelperText>
        <HelperText>
          <HelperTextItem>{props.description}</HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  )
}

export function Input(props: FormProps & Pick<TextInputProps, "type" | "readOnlyVariant" | "customIcon"> & Ctrl) {
  return (
    <Group {...props}>
      <TextInput
        isRequired
        type={props.type ?? "text"}
        readOnlyVariant={props.readOnlyVariant}
        customIcon={props.customIcon}
        id={props.fieldId}
        name={props.fieldId}
        aria-describedby={`${props.fieldId}-helper`}
        value={props.ctrl.values[props.fieldId]}
        onChange={(_, value) => props.ctrl.setValue(props.fieldId, value)}
      />
    </Group>
  )
}

export function Select(
  props: FormProps &
    Ctrl & { options: (string | SelectOptionProps)[]; icons?: ReactNode | ReactNode[]; selected?: string },
) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<string>(props.selected || "Please select one")

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
        onSelect={(_, value) => {
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
          {props.options.map((option, idx) => {
            const sprops = typeof option === "string" ? { value: option } : option
            return (
              <SelectOption
                key={sprops.value}
                {...sprops}
                icon={Array.isArray(props.icons) ? props.icons[idx] : props.icons}
              >
                {sprops.value}
              </SelectOption>
            )
          })}
        </SelectList>
      </PFSelect>
    </Group>
  )
}

export function NumberInput(props: FormProps & Ctrl & { defaultValue?: number; min?: number; max?: number }) {
  const [value, setValue] = useState<number | "">(props.defaultValue !== undefined ? props.defaultValue : 1)

  const onChange = (evt: React.FormEvent<HTMLInputElement>) => {
    props.ctrl.setValue(props.fieldId, evt.currentTarget.value)
  }

  const onClick = (incr: number) => () => {
    const newValue = (value as number) + incr
    props.ctrl.setValue(props.fieldId, newValue.toString())
    setValue(newValue)
  }
  const onMinus = onClick(-1)
  const onPlus = onClick(+1)

  return (
    <Group {...props}>
      <PFNumberInput
        value={value}
        min={props.min}
        max={props.max}
        onMinus={onMinus}
        onPlus={onPlus}
        onChange={onChange}
      />
    </Group>
  )
}
