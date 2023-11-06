import { useCallback } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { hash } from "./kind"
import type LocationProps from "./LocationProps"
import { href as detailsHref, type Entity } from "./details"

function returnTo(props: LocationProps, hash = props.location.hash, showThisEntity?: Entity) {
  const returnTo = props.searchParams.get("returnTo")
  const to = showThisEntity
    ? detailsHref(showThisEntity, props)
    : returnTo
    ? decodeURIComponent(returnTo).replace(/#\w+/, "")
    : props.location.pathname
  props.navigate(to.replace(/#.+$/, "") + hash)
}

export default function navigateToHome(props: LocationProps, showThisEntity?: Entity) {
  returnTo(props, props.location.hash ?? hash("applications"), showThisEntity)
}

export function returnHomeCallback() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  return useCallback(() => navigateToHome({ location, navigate, searchParams }), [location, navigate, searchParams])
}

export function returnHomeCallbackWithEntity() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  return useCallback(
    (entity: Entity) => navigateToHome({ location, navigate, searchParams }, entity),
    [location, navigate, searchParams],
  )
}
