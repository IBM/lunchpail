import type { ReactNode, ReactElement } from "react"
import { Divider, DrawerPanelBody } from "@patternfly/react-core"

import DrawerToolbar from "./Toolbar"

/** Content to be shown inside the "sidebar" drawer */
export default function DrawerContent(props: {
  body: ReactNode
  actions?: ReactElement[]
  rightActions?: ReactElement[]
}) {
  return (
    <>
      <DrawerPanelBody className="codeflare--detail-view-body">{props.body}</DrawerPanelBody>

      {((props.actions && props.actions?.length > 0) || (props.rightActions && props.rightActions?.length > 0)) && (
        <>
          <Divider />
          <DrawerPanelBody hasNoPadding className="codeflare--detail-view-footer">
            <DrawerToolbar actions={props.actions} rightActions={props.rightActions} />
          </DrawerPanelBody>
        </>
      )}
    </>
  )
}
