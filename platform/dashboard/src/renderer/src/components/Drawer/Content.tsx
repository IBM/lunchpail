import type { ReactNode, ReactElement } from "react"
import { Divider, DrawerPanelBody, Tabs, Tab, TabTitleText } from "@patternfly/react-core"

import DrawerToolbar from "./Toolbar"
import DetailNotFound from "./DetailNotFound"

/** Content to be shown inside the "sidebar" drawer */
export default function DrawerContent(props: {
  body: ReactNode
  actions?: ReactElement[]
  rightActions?: ReactElement[]
}) {
  return (
    <>
      <DrawerPanelBody className="codeflare--detail-view-body" hasNoPadding>
        <Tabs>
          <Tab title={<TabTitleText>Summary</TabTitleText>} eventKey={0}>
            <DrawerPanelBody>{props.body || <DetailNotFound />}</DrawerPanelBody>
          </Tab>
        </Tabs>
      </DrawerPanelBody>

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
