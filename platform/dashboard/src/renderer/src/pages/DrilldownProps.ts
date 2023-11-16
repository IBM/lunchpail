import { useCallback } from "react"

import LocationProps from "./LocationProps"
import navigateToHome from "../navigate/home"
import { navigateToDetails } from "../navigate/details"
import type { DrilldownProps, DrawerState } from "./DrawerContext"
import { currentlySelectedId, currentlySelectedKind } from "./current-detail"

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

/** Props to add to children to allow them to control the drawer behavior */
export default function drilldownProps(): DrilldownProps {
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
