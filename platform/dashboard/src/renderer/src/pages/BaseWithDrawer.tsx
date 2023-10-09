import { lazy, Suspense } from "react"
import type { ReactNode } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
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

const EmptyState = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyState })))
const EmptyStateHeader = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateHeader })))
const EmptyStateBody = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateBody })))
const EmptyStateIcon = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateIcon })))
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon"

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

import names, { Kind } from "../names"
import { hashIfNeeded } from "../navigate/kind"
import { isShowingDetails, navigateToDetails } from "../navigate/details"

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
      navigateToDetails(drawer, this.props)
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

  private get currentlySelectedKind(): Kind {
    return this.props.searchParams.get("kind") as Kind
  }

  private panelContent() {
    const id = this.currentlySelectedId
    const kind = this.currentlySelectedKind
    const body =
      id !== null && kind === "applications"
        ? ApplicationDetail(this.getApplication(id))
        : id !== null && kind === "datasets"
        ? DataSetDetail(this.getDataSet(id))
        : id !== null && kind === "workerpools"
        ? WorkerPoolDetail(this.getWorkerPool(id))
        : undefined

    return (
      <DrawerPanelContent className="codeflare--detail-view">
        <DrawerHead>
          <Breadcrumb>
            <BreadcrumbItem>Resources</BreadcrumbItem>
            <BreadcrumbItem to={hashIfNeeded(kind)}>{(kind && names[kind]) || kind}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h2" size="2xl">
            {id}
          </Title>
          <DrawerActions>
            <DrawerCloseButton onClick={this.returnHome} />
          </DrawerActions>
        </DrawerHead>
        <DrawerPanelBody>{body ?? this.detailNotFound()}</DrawerPanelBody>
      </DrawerPanelContent>
    )
  }

  private detailNotFound() {
    return (
      <Suspense fallback={<></>}>
        <EmptyState>
          <EmptyStateHeader
            titleText="Resource not found"
            headingLevel="h4"
            icon={<EmptyStateIcon icon={SearchIcon} />}
          />
          <EmptyStateBody>It may still be loading. Hang tight.</EmptyStateBody>
        </EmptyState>
      </Suspense>
    )
  }

  private get isDrawerExpanded() {
    return isShowingDetails(this.props)
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
