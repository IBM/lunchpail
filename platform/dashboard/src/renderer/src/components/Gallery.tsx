import type { ReactElement } from "react"
import { Gallery as PFGallery, type GalleryProps as PFGalleryProps } from "@patternfly/react-core"

import type { Props as CardInGalleryProps } from "./CardInGallery"

/**
 * Helpful to fix the size of the gallery nodes. Otherwise,
 * PatternFly's Gallery gets jiggy when you open/close the drawer
 */
const defaultWidth = { default: "29em" }

export type GalleryProps = {
  minWidths?: null | PFGalleryProps["minWidths"]
  maxWidths?: null | PFGalleryProps["maxWidths"]
  children: ReactElement<CardInGalleryProps>[]
}

export default function Gallery(props: GalleryProps) {
  return (
    <PFGallery
      hasGutter
      minWidths={props.minWidths === null ? undefined : props.minWidths ?? defaultWidth}
      maxWidths={props.maxWidths === null ? undefined : props.maxWidths ?? defaultWidth}
    >
      {props.children}
    </PFGallery>
  )
}
