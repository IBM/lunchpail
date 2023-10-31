import { Gallery } from "@patternfly/react-core"

/**
 * Helpful to fix the size of the gallery nodes. Otherwise,
 * PatternFly's Gallery gets jiggy when you open/close the drawer
 */
const width = { default: "18em" as const }

export default function JGallery(props: { children: import("react").ReactNode }) {
  return (
    <Gallery hasGutter minWidths={width} maxWidths={width}>
      {props.children}
    </Gallery>
  )
}
