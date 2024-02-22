import { useCallback } from "react"

import LocationProps from "./LocationProps"
import { navigateToDetails } from "../navigate/details"
import type { DrilldownProps, DrawerState } from "./DrawerContext"
import { currentlySelectedId, currentlySelectedKind, currentlySelectedContext } from "./current-detail"

/**
 * User has clicked on a UI element that should result in the drawer
 * ending up open, and showing the given content.
 */
function openDrawer(location: ReturnType<typeof LocationProps>) {
  return (drawer: DrawerState) => {
    // otherwise open and show that new content in the drawer
    navigateToDetails(drawer, location)
  }
}

/** Props to add to children to allow them to control the drawer behavior */
export default function drilldownProps(): DrilldownProps {
  const { location, navigate, searchParams } = LocationProps()

  const showDetails = useCallback(openDrawer({ location, navigate, searchParams }), [location, navigate, searchParams])

  return {
    showDetails,
    currentlySelectedId: currentlySelectedId(searchParams),
    currentlySelectedKind: currentlySelectedKind(searchParams),
    currentlySelectedContext: currentlySelectedContext(searchParams),
  }
}
