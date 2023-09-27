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
import type { LocationProps } from "../router/withLocation"
import type { DrilldownProps, DrawerState } from "../context/DrawerContext"

export type BaseWithDrawerState = BaseState & { drawer?: DrawerState }

export default abstract class BaseWithDrawer<
  Props extends LocationProps,
  State extends BaseWithDrawerState,
> extends Base<Props, State> {
  /** The content to display in the main (non drawer) section */
  protected abstract mainContentBody(): ReactNode

  /** State that will mark the drawer as closed */
  private closedDrawerState = { drawer: undefined }

  /**
   * User has clicked on a UI element that should result in the drawer
   * ending up closed.
   */
  protected readonly closeDrawer = () => this.setState(this.closedDrawerState)

  /**
   * User has clicked on a UI element that should result in the drawer
   * ending up open, and showing the given content.
   */
  private readonly openDrawer: DrilldownProps["showDetails"] = (drawer) => {
    this.setState((curState) => {
      if (curState?.drawer?.id === drawer.id) {
        // close if the user clicks on the currently displayed element
        return this.closedDrawerState
      } else {
        // otherwise open and show that new content in the drawer
        return { drawer }
      }
    })
  }

  /** Props to add to children to allow them to control the drawer behavior */
  protected drilldownProps(): DrilldownProps {
    return {
      showDetails: this.openDrawer,
      currentSelection: this.state?.drawer?.id,
    }
  }

  private panelContent() {
    return (
      <DrawerPanelContent isResizable minSize="300px" className="codeflare--detail-view">
        <DrawerHead>
          <Title headingLevel="h2" size="xl">
            {this.state?.drawer?.title()}
          </Title>
          <DrawerActions>
            <DrawerCloseButton onClick={this.closeDrawer} />
          </DrawerActions>
        </DrawerHead>
        <DrawerPanelBody>{this.state?.drawer?.body()}</DrawerPanelBody>
      </DrawerPanelContent>
    )
  }

  protected override body() {
    return (
      <Drawer isExpanded={!!this.state?.drawer} isInline>
        <DrawerContent panelContent={this.panelContent()} colorVariant="light-200">
          <DrawerContentBody hasPadding>{this.mainContentBody()}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
    )
  }
}
