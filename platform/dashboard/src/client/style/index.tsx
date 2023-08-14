import type * as CSS from "csstype"

// TODO: might have to have the boxes change color depending on state instead of this
const hover: { [P in CSS.SimplePseudos]?: CSS.Properties } = {
  ":hover": {
    backgroundColor: "grey",
    opacity: "0.33",
  },
}

export function BoxStyle(color?: string) {
  if (color) {
    return {
      backgroundColor: color,
      width: "1.375em",
      height: "1.375em",
      ...hover,
    }
  }
  return {
    right: "auto",
    left: "auto",
    bottom: "1rem",
    padding: "0.25rem",
    width: "auto",
    ...hover,
  }
}
