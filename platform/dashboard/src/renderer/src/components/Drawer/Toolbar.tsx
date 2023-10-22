import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core"

/** Content to be shown as a footer toolbar inside the "sidebar" drawer */
export default function DrawerToolbar(props: { actions: import("react").ReactElement[] }) {
  return (
    <Toolbar>
      <ToolbarContent>
        {props.actions.map((action) => (
          <ToolbarItem key={action.key}>{action}</ToolbarItem>
        ))}
      </ToolbarContent>
    </Toolbar>
  )
}
