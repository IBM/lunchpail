import { createContext, useCallback, useMemo, useState, type PropsWithChildren, type ReactNode } from "react"

import {
  Button,
  Breadcrumb,
  BreadcrumbItem,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelContent,
  Text,
  Title,
} from "@patternfly/react-core"

import PageWithMastheadAndModal, { type PageWithMastheadAndModalProps } from "./PageWithMastheadAndModal"

import providers from "../content/providers"
import { isNavigableKind } from "../content/NavigableKind"

import LocationProps from "./LocationProps"
import DetailNotFound from "../components/Drawer/DetailNotFound"
import { currentlySelectedId, currentlySelectedKind } from "./current-detail"

import navigateToHome from "../navigate/home"
import { hashIfNeeded } from "../navigate/kind"
import { isShowingDetails } from "../navigate/details"

import RestoreIcon from "@patternfly/react-icons/dist/esm/icons/window-restore-icon"
import MaximizeIcon from "@patternfly/react-icons/dist/esm/icons/window-maximize-icon"

import "./Detail.scss"

export const DrawerMaximizedContext = createContext(false)

/**
 * `props.children` is the content to be displayed in the "main",
 * i.e. not in the slide-out Drawer
 */
type Props = PropsWithChildren<
  PageWithMastheadAndModalProps & {
    /** The current subtitle of the slide-out Drawer panel */
    currentDetailSubtitle?: string

    /** The current content of the slide-out Drawer panel */
    currentDetailBody?: ReactNode
  }
>

export default function PageWithDrawer(props: Props) {
  const { location, navigate, searchParams } = LocationProps()

  const returnHome = useCallback(
    () => navigateToHome({ location, navigate, searchParams }),
    [location, navigate, searchParams],
  )

  const kind = currentlySelectedKind(searchParams)
  const provider = kind ? providers[kind] : undefined

  if (kind && !provider) {
    throw new Error(`Missing content provider for ${kind}`)
  }

  /** Is the slide-out drawer maximized? */
  const [isMaximized, setIsMaximized] = useState(false)

  /** Toggle the `isMaximized` state */
  const toggleIsMaximized = useCallback(() => setIsMaximized((curState) => !curState), [setIsMaximized])

  /** Width of the drawer: 100% if `isMaximized`, default behavior otherwise */
  const widths = useMemo(() => (isMaximized ? { default: "width_100" as const } : undefined), [isMaximized])

  /** @return the content to be shown in the drawer (*not* in the main body section) */
  // manually adding custom ouia labels because the Drawer component is not a ouia compatible component
  // resource: https://www.patternfly.org/developer-resources/open-ui-automation#usage
  //
  // re: the codeflare--detail-view-header
  // hasNoPadding/data-has/is-subtitle mess: this is because we want
  // the subtitle to occupy the full width of the drawer, but normal
  // DrawerHeads with DrawerActions only occupy the fraction of width
  // remaining after DrawerActions are placed; on top of this,
  // PatternFly's CSS places DrawerHead.className not on the "top
  // level" element, but on one nested inside, so we don't have direct
  // control over what happens, via classNames, without the
  // data-... tricksx
  const panelContent = (
    <DrawerPanelContent
      className="codeflare--detail-view"
      widths={widths}
      data-ouia-component-type="PF5/DrawerPanelContent"
      data-ouia-component-id={kind + "." + currentlySelectedId(searchParams)}
    >
      <DrawerHead
        className="codeflare--detail-view-header"
        hasNoPadding
        data-has-subtitle={props.currentDetailSubtitle || undefined}
      >
        <Breadcrumb>
          {provider?.isInSidebar && (
            <BreadcrumbItem>{provider.isInSidebar === true ? "Resources" : provider.isInSidebar}</BreadcrumbItem>
          )}
          <BreadcrumbItem to={isNavigableKind(kind) ? hashIfNeeded(kind) : undefined}>
            {(kind && providers[kind].name) ?? kind}
          </BreadcrumbItem>
        </Breadcrumb>
        <Title headingLevel="h2" size="2xl">
          {currentlySelectedId(searchParams)}
        </Title>

        <DrawerActions>
          <DrawerMaximizeButton isMaximized={isMaximized} onClick={toggleIsMaximized} />
          <DrawerCloseButton onClick={returnHome} />
        </DrawerActions>
      </DrawerHead>

      {props.currentDetailSubtitle && (
        <DrawerHead hasNoPadding data-is-subtitle className="codeflare--detail-view-header">
          <Text component="small">{props.currentDetailSubtitle}</Text>
        </DrawerHead>
      )}

      <DrawerMaximizedContext.Provider value={isMaximized}>
        {props.currentDetailBody || <DetailNotFound />}
      </DrawerMaximizedContext.Provider>
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
