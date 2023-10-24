import type { ReactElement } from "react"
import {
  Flex,
  FlexItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarGroupProps,
  ToolbarItem,
} from "@patternfly/react-core"

const flex_1 = { default: "flex_1" as const }

function Actions(props: Pick<ToolbarGroupProps, "variant"> & { actions: ReactElement[] }) {
  return (
    <ToolbarContent>
      <ToolbarGroup variant={props.variant}>
        {props.actions.map((action) => (
          <ToolbarItem key={action.key}>{action}</ToolbarItem>
        ))}
      </ToolbarGroup>
    </ToolbarContent>
  )
}

/** Content to be shown as a footer toolbar inside the "sidebar" drawer */
export default function DrawerToolbar(props: { actions?: ReactElement[]; rightActions?: ReactElement[] }) {
  return (
    <Toolbar>
      <Flex>
        <FlexItem flex={flex_1}>{props.actions && <Actions variant="button-group" actions={props.actions} />}</FlexItem>

        {props.rightActions && (
          <FlexItem>
            <Actions variant="icon-button-group" actions={props.rightActions} />
          </FlexItem>
        )}
      </Flex>
    </Toolbar>
  )
}
