import { useCallback, useState, type Ref, type ReactNode } from "react"
import {
  Badge,
  MenuToggle,
  MenuToggleElement,
  Select as PFSelect,
  SelectList,
  SelectOption,
  type SelectOptionProps,
} from "@patternfly/react-core"

import Group from "./Group"
import tryParse from "./tryParse"
import type { Ctrl, FormProps } from "./Props"

const maxWidth = {
  maxWidth: "200px",
} as import("react").CSSProperties

/** A multi-select (menu with checkbox) form element */
export default function SelectCheckbox(
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
