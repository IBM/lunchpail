import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { useCallback, useMemo, useState, type PropsWithChildren, type ReactNode } from "react"

import {
  Button,
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

import PageWithMastheadAndModal, { type PageWithMastheadAndModalProps } from "./PageWithMastheadAndModal"

import type { NavigableKind } from "../Kind"
import type { DrilldownProps, DrawerState } from "../context/DrawerContext"

import DetailNotFound from "../components/Drawer/DetailNotFound"

import names, { resourceNames } from "../names"

import navigateToHome from "../navigate/home"
import { hashIfNeeded } from "../navigate/kind"
import { isShowingDetails, navigateToDetails } from "../navigate/details"

import RestoreIcon from "@patternfly/react-icons/dist/esm/icons/window-restore-icon"
import MaximizeIcon from "@patternfly/react-icons/dist/esm/icons/window-maximize-icon"

import "./Detail.scss"

/**
 * `props.children` is the content to be displayed in the "main",
 * i.e. not in the slide-out Drawer
 */
type Props = PropsWithChildren<
  PageWithMastheadAndModalProps & {
    /** The current content of the slide-out Drawer panel */
    currentDetail?: ReactNode
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

  const kind = currentlySelectedKind(searchParams)

  /** Is the slide-out drawer maximized? */
  const [isMaximized, setIsMaximized] = useState(false)

  /** Toggle the `isMaximized` state */
  const toggleIsMaximized = useCallback(() => setIsMaximized((curState) => !curState), [setIsMaximized])

  /** Width of the drawer: 100% if `isMaximized`, default behavior otherwise */
  const widths = useMemo(() => (isMaximized ? { default: "width_100" as const } : undefined), [isMaximized])

  /** @return the content to be shown in the drawer (*not* in the main body section) */
  // manually adding custom ouia labels because the Drawer component is not a ouia compatible component
  // resource: https://www.patternfly.org/developer-resources/open-ui-automation#usage
  const panelContent = (
    <DrawerPanelContent
      className="codeflare--detail-view"
      widths={widths}
      data-ouia-component-type="PF5/DrawerPanelContent"
      data-ouia-component-id={kind + "." + currentlySelectedId(searchParams)}
    >
      <DrawerHead>
        <Breadcrumb>
          {kind in resourceNames && <BreadcrumbItem>Resources</BreadcrumbItem>}
          <BreadcrumbItem to={hashIfNeeded(kind)}>{(kind && names[kind]) || kind}</BreadcrumbItem>
        </Breadcrumb>
        <Title headingLevel="h2" size="2xl">
          {currentlySelectedId(searchParams)}
        </Title>

        <DrawerActions>
          <DrawerMaximizeButton isMaximized={isMaximized} onClick={toggleIsMaximized} />
          <DrawerCloseButton onClick={returnHome} />
        </DrawerActions>
      </DrawerHead>

      {props.currentDetail || <DetailNotFound />}
    </DrawerPanelContent>
  )

  const modalProps = {
    modal: props.modal,
    title: props.title,
    subtitle: props.subtitle,
    sidebar: props.sidebar,
    actions: props.actions,
  }

  return (
    <PageWithMastheadAndModal {...modalProps}>
      <Drawer isExpanded={isShowingDetails(searchParams)} isInline data-ouia-component-type="PF5/Drawer">
        <DrawerContent
          panelContent={panelContent}
          colorVariant="light-200"
          data-ouia-component-type="PF5/DrawerContent"
        >
          <DrawerContentBody hasPadding>{props.children}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </PageWithMastheadAndModal>
  )
}

/** UI to present a window maximize button-icon */
function DrawerMaximizeButton(props: { isMaximized: boolean; onClick: () => void }) {
  return (
    <Button variant="plain" icon={props.isMaximized ? <RestoreIcon /> : <MaximizeIcon />} onClick={props.onClick} />
  )
}
