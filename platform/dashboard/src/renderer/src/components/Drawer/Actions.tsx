import { type ReactElement } from "react"
import { ToolbarGroup, ToolbarItem, type ToolbarGroupProps } from "@patternfly/react-core"

/** Action buttons to be rendered in the Drawer footer */
export default function Actions(props: Pick<ToolbarGroupProps, "variant"> & { children: ReactElement[] }) {
  return (
    <ToolbarGroup variant={props.variant}>
      {props.children.map((action) => (
        <ToolbarItem key={action.key}>{action}</ToolbarItem>
      ))}
    </ToolbarGroup>
  )
}
