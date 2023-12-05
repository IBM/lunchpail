import { type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import { Drawer, DrawerContent, DrawerContentBody } from "@patternfly/react-core"

import { isShowingDetails } from "../../navigate/details"
import DrawerPanelContent, { type DrawerPanelProps } from "./PanelContent"

import "./Drawer.scss"

export type DrawerProps = DrawerPanelProps & {
  /** The content of the main (i.e. non-drawer) part */
  children: ReactNode
}

/**
 * The slide-out Drawer UI that is used to display the details of a
 * resource.
 */
export default function SlideOutDrawer(props: DrawerProps) {
  const [searchParams] = useSearchParams()

  return (
    <Drawer isExpanded={isShowingDetails(searchParams)} isInline data-ouia-component-type="PF5/Drawer">
      <DrawerContent
        colorVariant="light-200"
        data-ouia-component-type="PF5/DrawerContent"
        panelContent={<DrawerPanelContent panelSubtitle={props.panelSubtitle} panelBody={props.panelBody} />}
      >
        <DrawerContentBody hasPadding>{props.children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  )
}
