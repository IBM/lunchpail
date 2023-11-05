import { type PropsWithChildren, type ReactNode, type Ref, useCallback, useState } from "react"

import {
  Badge,
  Checkbox as PFCheckbox,
  CheckboxProps,
  type FormContextProps,
  FormGroup,
  type FormGroupProps,
  FormHelperText,
  HelperText,
  HelperTextItem,
  MenuToggle,
  type MenuToggleElement,
  NumberInput as PFNumberInput,
  Select as PFSelect,
  SelectOption,
  type SelectOptionProps,
  SelectList,
  TextArea as PFTextArea,
  type TextAreaProps,
  TextInput,
  type TextInputProps,
} from "@patternfly/react-core"

import type Kind from "../Kind"
import type { State } from "../Settings"

type Ctrl = { ctrl: Pick<FormContextProps, "values" | "setValue"> }
type FormProps = FormGroupProps & { description: string } & Required<Pick<FormGroupProps, "fieldId">>
type GroupProps = PropsWithChildren<FormProps>

import "./Forms.scss"

function Group(props: GroupProps) {
  return (
    <FormGroup
      isRequired={props.isRequired ?? true}
      label={props.label}
      fieldId={props.fieldId}
      labelInfo={props.labelInfo}
      data-has-pointer-events="true"
    >
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

export function TextArea(props: FormProps & TextAreaProps & Ctrl) {
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

export function Checkbox(
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

const width200 = {
  width: "200px",
}

const selectPopperProps = {
  width: "400px",
}

export function Select(
  props: FormProps &
    Ctrl & { options: (string | SelectOptionProps)[]; icons?: ReactNode | ReactNode[]; selected?: string },
) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<string>(
    props.selected || props.ctrl.values[props.fieldId] || "Please select one",
  )

  const onToggleClick = useCallback(() => setIsOpen((curState) => !curState), [setIsOpen])

  const onSelect = useCallback(
    (_, value: string | number | undefined) => {
      if (typeof value === "string") {
        props.ctrl.setValue(props.fieldId, value)
        setSelected(value)
      }
      setIsOpen(false)
    },
    [props.ctrl.setValue, setSelected, setIsOpen],
  )

  const toggle = useCallback(
    (ref: Ref<MenuToggleElement>) => (
      <MenuToggle ref={ref} onClick={onToggleClick} isExpanded={isOpen} style={width200}>
        {selected}
      </MenuToggle>
    ),
    [isOpen, setIsOpen],
  )

  if (props.ctrl.values[props.fieldId] && props.ctrl.values[props.fieldId] !== selected) {
    setSelected(props.ctrl.values[props.fieldId])
  }

  return (
    <Group {...props}>
      <PFSelect
        id={props.fieldId}
        isOpen={isOpen}
        aria-describedby={`${props.fieldId}-helper`}
        onOpenChange={setIsOpen}
        selected={selected}
        onSelect={onSelect}
        toggle={toggle}
        popperProps={selectPopperProps}
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

const maxWidth = {
  maxWidth: "200px",
} as React.CSSProperties

export function SelectCheckbox(
  props: FormProps &
    Ctrl & { options: (string | SelectOptionProps)[]; icons?: ReactNode | ReactNode[]; selected?: string[] },
) {
  const [isOpen, setIsOpen] = useState(false)

  const previouslySelected =
    typeof props.ctrl.values[props.fieldId] === "string" && props.ctrl.values[props.fieldId].length > 0
      ? tryParse(props.ctrl.values[props.fieldId])
      : []
  const [selectedItems, setSelectedItems] = useState<string[]>(props.selected || previouslySelected)

  const onToggleClick = useCallback(() => setIsOpen((curState) => !curState), [])

  const onSelect = useCallback(
    (_, value: string | number | undefined) => {
      if (typeof value === "string") {
        const newlySelected = selectedItems.includes(value)
          ? selectedItems.filter((id) => id !== value)
          : [...selectedItems, value]
        setSelectedItems(newlySelected)
        props.ctrl.setValue(props.fieldId, JSON.stringify(newlySelected))
      }
    },
    [selectedItems, setSelectedItems],
  )

  const toggle = useCallback(
    (ref: Ref<MenuToggleElement>) => (
      <MenuToggle ref={ref} onClick={onToggleClick} isExpanded={isOpen} style={maxWidth}>
        Select one or more
        {selectedItems.length > 0 && <Badge isRead>{selectedItems.length}</Badge>}
      </MenuToggle>
    ),
    [isOpen, onToggleClick],
  )

  return (
    <Group {...props}>
      <PFSelect
        role="menu"
        id={props.fieldId}
        isOpen={isOpen}
        selected={selectedItems}
        onSelect={onSelect}
        onOpenChange={setIsOpen}
        toggle={toggle}
      >
        <SelectList>
          {props.options.map((option, idx) => {
            const sprops = typeof option === "string" ? { value: option } : option
            return (
              <SelectOption
                key={sprops.value}
                {...sprops}
                hasCheckbox
                isSelected={selectedItems.includes(sprops.value)}
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
        min={props.min}
        max={props.max}
        onMinus={onMinus}
        onPlus={onPlus}
        onChange={onChange}
      />
    </Group>
  )
}

/**
 * Take a FormContextProps controller `ctrl` and intercept `setValue`
 * calls to also record them in our persistent state `formState`.
 */
export function remember(kind: Kind, ctrl: FormContextProps, formState: State<string> | undefined) {
  // origSetValue updates the local copy in the FormContextProvider
  const { setValue: origSetValue } = ctrl

  return Object.assign({}, ctrl, {
    setValue(fieldId: string, value: string) {
      origSetValue(fieldId, value)
      if (formState) {
        // remember user setting
        const form = tryParse(formState[0] || "{}")
        if (!form[kind]) {
          form[kind] = {}
        }
        form[kind][fieldId] = value
        formState[1](JSON.stringify(form))
      }
    },
  })
}

/** Try to parse as JSON */
function tryParse(value: string) {
  try {
    return JSON.parse(value)
  } catch (err) {
    console.error(`Error parsing as JSON: '${value}'`)
    return undefined
  }
}
