import { type MouseEvent, type ReactNode, useCallback } from "react"

import type NonEmptyArray from "@jay/util/NonEmptyArray"
import { Gallery, Tile, type TileProps } from "@patternfly/react-core"

import Group from "./Group"
import type { Ctrl, FormProps } from "./Props"

export type TileOption = Pick<TileProps, "title" | "icon" | "isDisabled"> & { description: ReactNode; value?: string }

export type TileOptions = NonEmptyArray<TileOption>

export default function Tiles(props: FormProps & Ctrl & { options: TileOptions; currentSelection?: string }) {
  //const [selected, setSelected] = useState(props.ctrl.values[props.fieldId] ?? props.options[0].value ?? props.options[0].title)
  const selected =
    props.selected ?? props.ctrl.values[props.fieldId] ?? props.options[0].value ?? props.options[0].title

  const onClick = useCallback(
    (evt: MouseEvent) => {
      const value = evt.currentTarget.getAttribute("data-value")
      if (value) {
        //setSelected(value)
        props.ctrl.setValue(props.fieldId, value)
      }
    },
    [props.ctrl.setValue, props.fieldId],
  )

  return (
    <Group {...props}>
      <div role="listbox" aria-label="Form Tiles">
        <Gallery hasGutter>
          {props.options.map((tile) => (
            <Tile
              data-value={tile.value ?? tile.title}
              isDisplayLarge
              isSelected={selected === tile.value ?? tile.title}
              onClick={onClick}
              isStacked
              title={tile.title}
              icon={tile.icon}
              isDisabled={tile.isDisabled}
            >
              {tile.description}
            </Tile>
          ))}
        </Gallery>
      </div>
    </Group>
  )
}
