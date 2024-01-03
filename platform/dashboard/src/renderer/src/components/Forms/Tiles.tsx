import { type MouseEvent, type ReactNode, useCallback } from "react"

import type NonEmptyArray from "@jay/util/NonEmptyArray"
import { Gallery, Tile, type TileProps } from "@patternfly/react-core"

import Group from "./Group"
import type { Ctrl, FormProps } from "./Props"

import "./Tiles.css"

export type TileOption<T extends string = string> = Pick<TileProps, "title" | "icon" | "isDisabled"> & {
  description: ReactNode
  value?: T
}

export type TileOptions<T extends string = string> = NonEmptyArray<TileOption<T>>

export default function Tiles(props: FormProps & Ctrl & { options: TileOptions; currentSelection?: string }) {
  //const [selected, setSelected] = useState(props.ctrl.values[props.fieldId] ?? props.options[0].value ?? props.options[0].title)
  const selected =
    props.currentSelection ?? props.ctrl.values[props.fieldId] ?? props.options[0].value ?? props.options[0].title

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
      <Gallery hasGutter role="listbox" aria-label="Form Tiles">
        {props.options.map((tile) => (
          <Tile
            className="codeflare--tile"
            isStacked
            key={tile.value ?? tile.title}
            icon={tile.icon}
            onClick={onClick}
            title={tile.title}
            isDisabled={tile.isDisabled}
            data-value={tile.value ?? tile.title}
            isSelected={selected === (tile.value ?? tile.title)}
          >
            {tile.description}
          </Tile>
        ))}
      </Gallery>
    </Group>
  )
}
