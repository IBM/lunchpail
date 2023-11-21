import { type MouseEvent, type ReactNode, useCallback } from "react"

import type NonEmptyArray from "@jay/util/NonEmptyArray"
import { Gallery, Tile, type TileProps } from "@patternfly/react-core"

import type { Ctrl, FormProps } from "./Props"

export type TileOptions = NonEmptyArray<
  Pick<TileProps, "title" | "icon" | "isDisabled"> & { description: ReactNode; value?: string }
>

export default function Tiles(props: FormProps & Ctrl & { options: TileOptions }) {
  //const [selected, setSelected] = useState(props.ctrl.values[props.fieldId] ?? props.options[0].value ?? props.options[0].title)
  const selected = props.ctrl.values[props.fieldId] ?? props.options[0].value ?? props.options[0].title

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
  )
}
