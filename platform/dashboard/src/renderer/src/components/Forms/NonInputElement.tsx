import type { PropsWithChildren } from "react"

import Group from "./Group"
import type { FormProps } from "./Props"

/**
 * Render some non-input eleent `props.children` so that it has the
 * same "group" decorations, e.g. a label and description, as normal
 * form elements.
 */
export default function NonInputElement(props: PropsWithChildren<FormProps>) {
  return <Group {...props} isRequired={false} />
}
