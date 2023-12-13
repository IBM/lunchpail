import { useCallback, useEffect, useMemo, useRef, useState, type Ref, type ReactNode, type KeyboardEvent } from "react"
import {
  Button,
  Divider,
  MenuToggle,
  MenuToggleElement,
  Select as PFSelect,
  SelectList,
  SelectOption,
  type SelectOptionProps as PFSelectOptionProps,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from "@patternfly/react-core"

import Group from "./Group"
import type { Ctrl, FormProps } from "./Props"

import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon"

const selectPopperProps = {
  width: "400px",
}

/** Optionally, you may provide a `search` field that is used when filtering */
type SelectOptionProps = PFSelectOptionProps & { search?: string }
export type { SelectOptionProps }
export type SelectOption = string | SelectOptionProps

/** A select form element */
export default function Select(
  props: FormProps &
    Ctrl & { options: SelectOption[]; icons?: ReactNode | ReactNode[]; currentSelection?: string; borders?: boolean },
) {
  const initialOptions = useMemo(
    () => props.options.map((value) => (typeof value === "string" ? { value } : value)),
    [props.options],
  )

  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(props.currentSelection)
  const [filterValue, setFilterValue] = useState("")
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null)
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [selectOptions, setSelectOptions] = useState<SelectOptionProps[]>(initialOptions)
  const [selected, setSelected] = useState(
    props.currentSelection ?? props.ctrl.values[props.fieldId] ?? "Please select one",
  )

  const textInputRef = useRef<HTMLInputElement>()

  const onToggleClick = useCallback(() => setIsOpen((curState) => !curState), [setIsOpen])

  const onSelect = useCallback(
    (_, value: string | number | undefined) => {
      if (typeof value === "string" && value !== "no results") {
        setInputValue(value as string)
        setFilterValue("")
        setSelected(value)

        props.ctrl.setValue(props.fieldId, value)
      }
      setIsOpen(false)
      setFocusedItemIndex(null)
      setActiveItem(null)
    },
    [props.ctrl.setValue, setSelected, setIsOpen],
  )

  const handleMenuArrowKeys = useCallback(
    (key: string) => {
      let indexToFocus

      if (isOpen) {
        if (key === "ArrowUp") {
          // When no index is set or at the first index, focus to the last, otherwise decrement focus index
          if (focusedItemIndex === null || focusedItemIndex === 0) {
            indexToFocus = selectOptions.length - 1
          } else {
            indexToFocus = focusedItemIndex - 1
          }
        }

        if (key === "ArrowDown") {
          // When no index is set or at the last index, focus to the first, otherwise increment focus index
          if (focusedItemIndex === null || focusedItemIndex === selectOptions.length - 1) {
            indexToFocus = 0
          } else {
            indexToFocus = focusedItemIndex + 1
          }
        }

        setFocusedItemIndex(indexToFocus)
        const focusedItem = selectOptions.filter((option) => !option.isDisabled)[indexToFocus]
        setActiveItem(`select-typeahead-${focusedItem.value.replace(" ", "-")}`)
      }
    },
    [isOpen, selectOptions, focusedItemIndex, setActiveItem, setFocusedItemIndex],
  )

  const onInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      const enabledMenuItems = selectOptions.filter((option) => !option.isDisabled)
      const [firstMenuItem] = enabledMenuItems
      const focusedItem = focusedItemIndex ? enabledMenuItems[focusedItemIndex] : firstMenuItem

      switch (event.key) {
        // Select the first available option
        case "Enter":
          if (isOpen && focusedItem.value !== "no results") {
            setInputValue(String(focusedItem.children))
            setFilterValue("")
            setSelected(String(focusedItem.children))
          }

          setIsOpen((prevIsOpen) => !prevIsOpen)
          setFocusedItemIndex(null)
          setActiveItem(null)

          event.preventDefault()
          break
        case "Tab":
        case "Escape":
          setIsOpen(false)
          setActiveItem(null)
          break
        case "ArrowUp":
        case "ArrowDown":
          event.preventDefault()
          handleMenuArrowKeys(event.key)
          break
      }
    },
    [
      selectOptions,
      focusedItemIndex,
      handleMenuArrowKeys,
      setActiveItem,
      setFocusedItemIndex,
      setIsOpen,
      setFilterValue,
    ],
  )

  useEffect(() => {
    let newSelectOptions = initialOptions

    // Filter menu items based on the text input value when one exists
    if (filterValue) {
      newSelectOptions = initialOptions.filter((menuItem) =>
        (menuItem.search ?? String(menuItem.children)).toLowerCase().includes(filterValue.toLowerCase()),
      )

      // When no options are found after filtering, display 'No results found'
      if (!newSelectOptions.length) {
        newSelectOptions = [
          { isDisabled: false, children: `No results found for "${filterValue}"`, value: "no results" },
        ]
      }

      // Open the menu when the input value changes and the new value is not empty
      if (!isOpen) {
        setIsOpen(true)
      }
    }

    setSelectOptions(newSelectOptions)
    setActiveItem(null)
    setFocusedItemIndex(null)
  }, [initialOptions, filterValue])

  const onTextInputChange = useCallback(
    (_, value: string) => {
      setInputValue(value)
      setFilterValue(value)
    },
    [setInputValue, setFilterValue],
  )

  const onInputClick = useCallback(() => {
    setSelected("")
    setInputValue("")
    setFilterValue("")
    textInputRef?.current?.focus()
  }, [setSelected, setInputValue, setFilterValue, textInputRef?.current])

  const toggle = useCallback(
    (ref: Ref<MenuToggleElement>) => (
      <MenuToggle ref={ref} variant="typeahead" onClick={onToggleClick} isExpanded={isOpen} isFullWidth>
        <TextInputGroup isPlain>
          <TextInputGroupMain
            value={inputValue}
            onClick={onToggleClick}
            onChange={onTextInputChange}
            onKeyDown={onInputKeyDown}
            id="create-typeahead-select-input"
            autoComplete="off"
            innerRef={textInputRef}
            placeholder="Select a context"
            {...(activeItem && { "aria-activedescendant": activeItem })}
            role="combobox"
            isExpanded={isOpen}
            aria-controls="select-create-typeahead-listbox"
          />

          <TextInputGroupUtilities>
            {!!inputValue && (
              <Button variant="plain" onClick={onInputClick} aria-label="Clear input value">
                <TimesIcon aria-hidden />
              </Button>
            )}
          </TextInputGroupUtilities>
        </TextInputGroup>
      </MenuToggle>
    ),
    [isOpen, setIsOpen, inputValue, onToggleClick, onTextInputChange, onInputKeyDown, textInputRef, onInputClick],
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
          {selectOptions.flatMap((option, idx, A) => {
            const sprops = typeof option === "string" ? { value: option } : option
            return [
              <SelectOption
                key={sprops.value}
                {...sprops}
                isFocused={focusedItemIndex === idx}
                onClick={() => setSelected(option.value)}
                icon={Array.isArray(props.icons) ? props.icons[idx] : props.icons}
                ref={null}
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
