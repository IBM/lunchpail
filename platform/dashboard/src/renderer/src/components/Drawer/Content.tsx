import { type ReactElement } from "react"
import { Divider, DrawerPanelBody } from "@patternfly/react-core"

import DrawerToolbar from "./Toolbar"
import TabbedContent from "./TabbedContent"

export type Props = import("./TabbedContent").Props & {
  /** Actions to be displayed left-justified */
  actions?: ReactElement[]

  /** Actions to be displayed right-justified */
  rightActions?: ReactElement[]

  /** Override default initial tab */
  defaultActiveKey?: string
}

/**
 * Content to be shown inside the "sidebar" drawer.
 * |--------------------------|
 * | DrawerPanelBody          |
 * |   Tab1 Tab2 TabT3        |
 * |   Content1               |
 * |                          |
 * | actions     rightActions |
 * |--------------------------|
 */
export default function DrawerContent(props: Props) {
  return (
    <>
      {mainBodyPart(props)}
      {footerPart(props)}
    </>
  )
}

/**
 * This includes the non-footer elements of the Drawer panel
 * |--------------------------|
 * | DrawerPanelBody          |
 * |   Tab1 Tab2 TabT3        |
 * |   Content1               |
 * |--------------------------|
 */
function mainBodyPart(props: Props) {
  return (
    <DrawerPanelBody className="codeflare--detail-view-body" hasNoPadding>
      <TabbedContent
        summary={props.summary}
        raw={props.raw}
        otherTabs={props.otherTabs}
        defaultActiveKey={props.defaultActiveKey}
      />
    </DrawerPanelBody>
  )
}

/**
 * This includes the footer elements of the Drawer panel
 * |--------------------------|
 * | actions     rightActions |
 * |--------------------------|
 */
function footerPart(props: Props) {
  return (
    ((props.actions && props.actions?.length > 0) || (props.rightActions && props.rightActions?.length > 0)) && (
      <>
        <Divider />
        <DrawerPanelBody hasNoPadding className="codeflare--detail-view-footer">
          <DrawerToolbar actions={props.actions} rightActions={props.rightActions} />
        </DrawerPanelBody>
      </>
    )
  )
}
