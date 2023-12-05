import { createContext, useCallback, useMemo, useState, type ReactNode } from "react"

import {
  Button,
  Breadcrumb,
  BreadcrumbItem,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelContent,
  Text,
  Title,
} from "@patternfly/react-core"

import DetailNotFound from "./DetailNotFound"

import navigateToHome from "../../navigate/home"
import { hashIfNeeded } from "../../navigate/kind"

import providers from "../../content/providers"
import { isNavigableKind } from "../../content/NavigableKind"

import LocationProps from "../../pages/LocationProps"
import { currentlySelectedId, currentlySelectedKind } from "../../pages/current-detail"

import RestoreIcon from "@patternfly/react-icons/dist/esm/icons/window-restore-icon"
import MaximizeIcon from "@patternfly/react-icons/dist/esm/icons/window-maximize-icon"

export const DrawerMaximizedContext = createContext(false)

export type DrawerPanelProps = {
  /** The current subtitle of the slide-out Drawer panel */
  panelSubtitle?: string

  /** The current content of the slide-out Drawer panel */
  panelBody?: ReactNode
}

/** UI to present a window maximize button-icon */
function DrawerMaximizeButton(props: { isMaximized: boolean; onClick: () => void }) {
  return (
    <Button variant="plain" icon={props.isMaximized ? <RestoreIcon /> : <MaximizeIcon />} onClick={props.onClick} />
  )
}

/**
 * This is the content of the slide-out Drawer
 */
export default function SlideOutDrawerPanelContent(props: DrawerPanelProps) {
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
  return (
    <DrawerPanelContent
      className="codeflare--detail-view"
      widths={widths}
      data-ouia-component-type="PF5/DrawerPanelContent"
      data-ouia-component-id={kind + "." + currentlySelectedId(searchParams)}
    >
      <DrawerHead
        hasNoPadding
        className="codeflare--detail-view-header"
        data-has-subtitle={props.panelSubtitle || undefined}
      >
        <Breadcrumb>
          {provider?.isInSidebar && (
            <BreadcrumbItem>{provider.isInSidebar === true ? "Resources" : provider.isInSidebar}</BreadcrumbItem>
          )}
          <BreadcrumbItem to={isNavigableKind(kind) ? hashIfNeeded(kind) : undefined}>
            {provider?.name ?? kind}
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

      {props.panelSubtitle && (
        <DrawerHead hasNoPadding data-is-subtitle className="codeflare--detail-view-header">
          <Text component="small">{props.panelSubtitle}</Text>
        </DrawerHead>
      )}

      <DrawerMaximizedContext.Provider value={isMaximized}>
        {props.panelBody || <DetailNotFound />}
      </DrawerMaximizedContext.Provider>
    </DrawerPanelContent>
  )
}
