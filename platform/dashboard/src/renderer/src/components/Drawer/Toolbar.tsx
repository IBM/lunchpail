import type { ReactElement } from "react"
import { Flex, FlexItem, Toolbar } from "@patternfly/react-core"

import Actions from "./Actions"
import HistoryActions from "./History"

const flex_1 = { default: "flex_1" as const }

/** Content to be shown as a footer toolbar inside the "sidebar" drawer */
export default function DrawerToolbar(props: { actions?: ReactElement[]; rightActions?: ReactElement[] }) {
  return (
    <Toolbar>
      <Flex>
        <FlexItem>
          <HistoryActions />
        </FlexItem>

        <FlexItem flex={flex_1}>{props.actions && <Actions variant="button-group">{props.actions}</Actions>}</FlexItem>

        {props.rightActions && (
          <FlexItem>
            <Actions variant="icon-button-group">{props.rightActions}</Actions>
          </FlexItem>
        )}
      </Flex>
    </Toolbar>
  )
}
