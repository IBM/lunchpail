import type { ReactElement } from "react"
import { Flex, FlexItem, Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core"

const flex_1 = { default: "flex_1" as const }

/** Content to be shown as a footer toolbar inside the "sidebar" drawer */
export default function DrawerToolbar(props: { actions?: ReactElement[]; rightActions?: ReactElement[] }) {
  return (
    <Toolbar>
      <Flex>
        <FlexItem flex={flex_1}>
          {props.actions && (
            <ToolbarContent>
              {props.actions.map((action) => (
                <ToolbarItem key={action.key}>{action}</ToolbarItem>
              ))}
            </ToolbarContent>
          )}
        </FlexItem>

        {props.rightActions && (
          <FlexItem>
            <ToolbarContent>
              {props.rightActions.map((action) => (
                <ToolbarItem key={action.key}>{action}</ToolbarItem>
              ))}
            </ToolbarContent>
          </FlexItem>
        )}
      </Flex>
    </Toolbar>
  )
}
