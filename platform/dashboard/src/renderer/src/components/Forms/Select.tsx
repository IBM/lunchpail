import { useCallback, useState, type Ref, type ReactNode } from "react"
import {
  Divider,
  MenuToggle,
  MenuToggleElement,
  Select as PFSelect,
  SelectList,
  SelectOption,
  type SelectOptionProps,
} from "@patternfly/react-core"

import Group from "./Group"
import type { Ctrl, FormProps } from "./Props"

const selectPopperProps = {
  width: "400px",
}

export type { SelectOptionProps }
export type SelectOption = string | SelectOptionProps

/** A select form element */
export default function Select(
  props: FormProps &
    Ctrl & { options: SelectOption[]; icons?: ReactNode | ReactNode[]; currentSelection?: string; borders?: boolean },
) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<string>(
    props.currentSelection ?? props.ctrl.values[props.fieldId] ?? "Please select one",
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
      <MenuToggle ref={ref} onClick={onToggleClick} isExpanded={isOpen}>
        {selected}
      </MenuToggle>
    ),
    [isOpen, setIsOpen],
  )

  if (!props.selected && props.ctrl.values[props.fieldId] && props.ctrl.values[props.fieldId] !== selected) {
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
        isScrollable
        popperProps={selectPopperProps}
      >
        <SelectList>
          {props.options.flatMap((option, idx, A) => {
            const sprops = typeof option === "string" ? { value: option } : option
            return [
              <SelectOption
                key={sprops.value}
                {...sprops}
                icon={Array.isArray(props.icons) ? props.icons[idx] : props.icons}
              >
                {sprops.children ?? sprops.value}
              </SelectOption>,

              ...(!props.borders || idx === A.length - 1 ? [] : [<Divider key={idx} />]),
            ]
          })}
        </SelectList>
      </PFSelect>
    </Group>
  )
}
