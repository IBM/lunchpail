import { lazy, Suspense } from "react"
import type { ReactNode } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  Divider,
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
import Settings from "../Settings"
import Status, { StatusCtxType } from "../Status"

import type { NavigableKind } from "../Kind"
import type { BaseState } from "./Base"
import type { LocationProps } from "../router/withLocation"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"
import type { DrilldownProps, DrawerState } from "../context/DrawerContext"
export type BaseWithDrawerState = BaseState & { drawer?: DrawerState }
import type DataSetProps from "../components/DataSet/Props"
import type WorkerPoolProps from "../components/WorkerPool/Props"

import DataSetDetail from "../components/DataSet/Detail"
import WorkerPoolDetail from "../components/WorkerPool/Detail"
import ApplicationDetail from "../components/Application/Detail"
import JobManagerDetail from "../components/ControlPlaneStatus/Detail"

import names from "../names"
import { hashIfNeeded } from "../navigate/kind"
import { isShowingDetails, navigateToDetails } from "../navigate/details"

import "./Detail.scss"

export default abstract class BaseWithDrawer<
  Props extends LocationProps,
  State extends BaseWithDrawerState,
> extends Base<Props, State> {
  /** The content to display in the main (non drawer) section */
  protected abstract mainContentBody(): ReactNode

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

  private get currentlySelectedKind(): NavigableKind {
    return this.props.searchParams.get("kind") as NavigableKind
  }

  protected closeDetailViewIfShowing(id: string, kind: NavigableKind) {
    if (this.currentlySelectedId === id && this.currentlySelectedKind === kind) {
      this.returnHome()
    }
  }

  /** @return the content to be shown in the drawer (*not* in the main body section) */
  private panelContent() {
    const id = this.currentlySelectedId
    const kind = this.currentlySelectedKind

    const contentFn = (demoMode: boolean, status: StatusCtxType) =>
      id !== null && kind === "applications"
        ? ApplicationDetail(this.getApplication(id))
        : id !== null && kind === "datasets"
        ? DataSetDetail(this.getDataSet(id))
        : id !== null && kind === "workerpools"
        ? WorkerPoolDetail(this.getWorkerPool(id), this.props)
        : kind === "jobmanager"
        ? JobManagerDetail(demoMode, status)
        : { actions: undefined as ReactNode, body: undefined as ReactNode }

    return (
      <Settings.Consumer>
        {(settings) => (
          <Status.Consumer>
            {(status) => {
              const content = contentFn(settings?.demoMode[0] ?? false, status)
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
                  <DrawerPanelBody className="codeflare--detail-view-body">
                    {content.body ?? this.detailNotFound()}
                  </DrawerPanelBody>
                  {"actions" in content && content.actions && (
                    <>
                      <Divider />
                      <DrawerPanelBody className="codeflare--detail-view-footer">{content.actions}</DrawerPanelBody>
                    </>
                  )}
                </DrawerPanelContent>
              )
            }}
          </Status.Consumer>
        )}
      </Settings.Consumer>
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
