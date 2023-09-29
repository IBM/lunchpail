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
import type ApplicationSpecEvent from "../events/ApplicationSpecEvent"
import type { DrilldownProps, DrawerState } from "../context/DrawerContext"

export type BaseWithDrawerState = BaseState & { drawer?: DrawerState }

import type DataSetProps from "../components/DataSet/Props"
import type WorkerPoolProps from "../components/WorkerPool/Props"
import DataSetDetail from "../components/DataSet/Detail"
import WorkerPoolDetail from "../components/WorkerPool/Detail"
import ApplicationDetail from "../components/Application/Detail"

import "./Detail.scss"

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
   * ending up open, and showing the given content.
   */
  private readonly openDrawer: DrilldownProps["showDetails"] = (drawer) => {
    if (this.currentlySelectedId === drawer.id && this.currentlySelectedKind === drawer.kind) {
      // close if the user clicks on the currently displayed element
      this.returnHome()
    } else {
      // otherwise open and show that new content in the drawer
      this.props.navigate(`?id=${drawer.id}&kind=${drawer.kind}#detail`)
    }
  }

  /** Props to add to children to allow them to control the drawer behavior */
  protected drilldownProps(): DrilldownProps {
    return {
      showDetails: this.openDrawer,
      currentlySelectedId: this.currentlySelectedId,
      currentlySelectedKind: this.currentlySelectedKind,
    }
  }

  protected abstract getApplication(id: string): ApplicationSpecEvent | undefined
  protected abstract getDataSet(id: string): DataSetProps | undefined
  protected abstract getWorkerPool(id: string): WorkerPoolProps | undefined

  private get currentlySelectedId() {
    return this.props.searchParams.get("id")
  }

  private get currentlySelectedKind() {
    return this.props.searchParams.get("kind")
  }

  private panelContent() {
    const id = this.currentlySelectedId
    const kind = this.currentlySelectedKind
    const body =
      id !== null && kind === "Application"
        ? ApplicationDetail(this.getApplication(id))
        : id !== null && kind === "DataSet"
        ? DataSetDetail(this.getDataSet(id))
        : id !== null && kind === "WorkerPool"
        ? WorkerPoolDetail(this.getWorkerPool(id))
        : undefined

    return (
      <DrawerPanelContent isResizable minSize="300px" className="codeflare--detail-view">
        <DrawerHead>
          <Title headingLevel="h2" size="xl">
            {kind}
          </Title>
          <DrawerActions>
            <DrawerCloseButton onClick={this.returnHome} />
          </DrawerActions>
        </DrawerHead>
        <DrawerPanelBody>{body || "Not Found"}</DrawerPanelBody>
      </DrawerPanelContent>
    )
  }

  private get isDrawerExpanded() {
    return this.props.location.hash.startsWith("#detail")
  }

  protected override body() {
    return (
      <Drawer isExpanded={this.isDrawerExpanded} isInline>
        <DrawerContent panelContent={this.panelContent()} colorVariant="light-200">
          <DrawerContentBody hasPadding>{this.mainContentBody()}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
    )
  }
}
