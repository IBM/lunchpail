import type { ReactElement } from "react"
import { Toolbar, ToolbarContent, ToolbarGroup } from "@patternfly/react-core"

import Actions from "./Actions"
import HistoryActions from "./History"

const flex_1 = { flex: 1 }

function Filler() {
  return <ToolbarGroup style={flex_1} />
}

/** Content to be shown as a footer toolbar inside the "sidebar" drawer */
export default function DrawerToolbar(props: { actions?: ReactElement[]; rightActions?: ReactElement[] }) {
  return (
    <Toolbar>
      <ToolbarContent alignItems="center">
        <HistoryActions />
        <Filler />

        {props.actions && <Actions variant="button-group">{props.actions}</Actions>}

        {props.rightActions && <Actions variant="icon-button-group">{props.rightActions}</Actions>}
      </ToolbarContent>
    </Toolbar>
  )
}
