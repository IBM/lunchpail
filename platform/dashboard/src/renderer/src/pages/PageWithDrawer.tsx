import { useCallback, lazy, Suspense } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import type { PropsWithChildren } from "react"

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
  DrawerPanelContent,
} from "@patternfly/react-core"

const EmptyState = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyState })))
const EmptyStateHeader = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateHeader })))
const EmptyStateBody = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateBody })))
const EmptyStateIcon = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateIcon })))
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon"

import PageWithMastheadAndModal from "./PageWithMastheadAndModal"

import type { NavigableKind } from "../Kind"
import type { PageWithMastheadAndModalProps } from "./PageWithMastheadAndModal"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"
import type { DrilldownProps, DrawerState } from "../context/DrawerContext"
import type DataSetProps from "../components/DataSet/Props"
import type WorkerPoolProps from "../components/WorkerPool/Props"

import DataSetDetail from "../components/DataSet/Detail"
import WorkerPoolDetail from "../components/WorkerPool/Detail"
import ApplicationDetail from "../components/Application/Detail"
import JobManagerDetail from "../components/JobManager/Detail"

import names, { resourceNames } from "../names"

import navigateToHome from "../navigate/home"
import { hashIfNeeded } from "../navigate/kind"
import { isShowingDetails, navigateToDetails } from "../navigate/details"

import "./Detail.scss"

type Props = PropsWithChildren<
  PageWithMastheadAndModalProps & {
    getApplication(name: string): ApplicationSpecEvent | undefined
    getDataSet(name: string): DataSetProps | undefined
    getWorkerPool(name: string): WorkerPoolProps | undefined
  }
>

export function LocationProps() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = useSearchParams()[0]
  return { location, navigate, searchParams }
}

export function returnHome(location: ReturnType<typeof LocationProps>) {
  return () => navigateToHome(location)
}

export function closeDetailViewIfShowing(
  id: string,
  kind: NavigableKind,
  returnHome: () => void,
  searchParams = new URLSearchParams(window.location.search),
) {
  if (currentlySelectedId(searchParams) === id && currentlySelectedKind(searchParams) === kind) {
    returnHome()
  }
}

function currentlySelectedId(searchParams: URLSearchParams) {
  return searchParams.get("id")
}

function currentlySelectedKind(searchParams: URLSearchParams) {
  return searchParams.get("kind") as NavigableKind
}

/** Props to add to children to allow them to control the drawer behavior */
export function drilldownProps(): DrilldownProps {
  const { location, navigate, searchParams } = LocationProps()

  const returnHome = useCallback(
    () => navigateToHome({ location, navigate, searchParams }),
    [location, navigate, searchParams],
  )
  const showDetails = useCallback(openDrawer(returnHome, { location, navigate, searchParams }), [
    location,
    navigate,
    searchParams,
  ])

  return {
    showDetails,
    currentlySelectedId: currentlySelectedId(searchParams),
    currentlySelectedKind: currentlySelectedKind(searchParams),
  }
}

/**
 * User has clicked on a UI element that should result in the drawer
 * ending up open, and showing the given content.
 */
function openDrawer(returnHome: () => void, location: ReturnType<typeof LocationProps>) {
  return (drawer: DrawerState) => {
    if (
      currentlySelectedId(location.searchParams) === drawer.id &&
      currentlySelectedKind(location.searchParams) === drawer.kind
    ) {
      // close if the user clicks on the currently displayed element
      returnHome()
    } else {
      // otherwise open and show that new content in the drawer
      navigateToDetails(drawer, location)
    }
  }
}

export default function PageWithDrawer(props: Props) {
  const { location, navigate, searchParams } = LocationProps()

  const returnHome = useCallback(
    () => navigateToHome({ location, navigate, searchParams }),
    [location, navigate, searchParams],
  )

  /** @return the content to be shown in the drawer (*not* in the main body section) */
  function PanelContent() {
    const id = currentlySelectedId(searchParams)
    const kind = currentlySelectedKind(searchParams)

    const body =
      id !== null && kind === "applications" ? (
        ApplicationDetail(props.getApplication(id))
      ) : id !== null && kind === "datasets" ? (
        DataSetDetail(props.getDataSet(id))
      ) : id !== null && kind === "workerpools" ? (
        WorkerPoolDetail(props.getWorkerPool(id))
      ) : kind === "controlplane" ? (
        <JobManagerDetail />
      ) : (
        <DetailNotFound />
      )

    return (
      <DrawerPanelContent className="codeflare--detail-view">
        <DrawerHead>
          <Breadcrumb>
            {kind in resourceNames && <BreadcrumbItem>Resources</BreadcrumbItem>}
            <BreadcrumbItem to={hashIfNeeded(kind)}>{(kind && names[kind]) || kind}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h2" size="2xl">
            {id}
          </Title>

          <DrawerActions>
            <DrawerCloseButton onClick={returnHome} />
          </DrawerActions>
        </DrawerHead>

        {body}
      </DrawerPanelContent>
    )
  }

  function DetailNotFound() {
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

  const body = (
    <Drawer isExpanded={isShowingDetails(searchParams)} isInline>
      <DrawerContent panelContent={<PanelContent />} colorVariant="light-200">
        <DrawerContentBody hasPadding>{props.children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  )

  return <PageWithMastheadAndModal {...props}>{body}</PageWithMastheadAndModal>
}
