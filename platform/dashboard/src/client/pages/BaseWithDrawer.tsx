import type { ReactNode } from "react"

import {
  Title,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
} from "@patternfly/react-core"

import Base from "./Base"

import type { BaseState } from "./Base"
import type { DrilldownProps, DrawerState } from "../context/DrawerContext"

export type BaseWithDrawerState = BaseState & Partial<DrawerState>

export default abstract class BaseWithDrawer<Props, State extends BaseWithDrawerState> extends Base<Props, State> {
  /** The content to display in the main (non drawer) section */
  protected abstract mainContentBody(): ReactNode

  /**
   * User has clicked on a UI element that should result in the drawer
   * ending up closed.
   */
  protected readonly closeDrawer = () => this.setState({ drawerTitle: undefined, drawerBody: undefined })

  /**
   * User has clicked on a UI element that should result in the drawer
   * ending up open, and showing the given content.
   */
  private readonly openDrawer: DrilldownProps["showDetails"] = (drawerSelection, drawerTitle, drawerBody) => {
    this.setState((curState) => {
      if (curState?.drawerSelection === drawerSelection) {
        // close if the user clicks on the currently displayed element
        return { drawerSelection: undefined, drawerTitle: undefined, drawerBody: undefined }
      } else {
        // otherwise open and show that new content in the drawer
        return { drawerSelection, drawerTitle, drawerBody }
      }
    })
  }

  /** Props to add to children to allow them to control the drawer behavior */
  protected drawerProps(): DrilldownProps {
    return {
      showDetails: this.openDrawer,
      currentSelection: this.state?.drawerSelection,
    }
  }

  private panelContent() {
    return (
      <DrawerPanelContent isResizable minSize="300px" className="codeflare--detail-view">
        <DrawerHead>
          <Title headingLevel="h2" size="xl">
            {this.state?.drawerTitle && this.state.drawerTitle()}
          </Title>
          <DrawerActions>
            <DrawerCloseButton onClick={this.closeDrawer} />
          </DrawerActions>
        </DrawerHead>
        <DrawerPanelBody>{this.state?.drawerBody && this.state.drawerBody()}</DrawerPanelBody>
      </DrawerPanelContent>
    )
  }

  protected override body() {
    return (
      <Drawer isExpanded={!!this.state?.drawerTitle} isInline>
        <DrawerContent panelContent={this.panelContent()} colorVariant="light-200">
          <DrawerContentBody hasPadding>{this.mainContentBody()}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
    )
  }
}
