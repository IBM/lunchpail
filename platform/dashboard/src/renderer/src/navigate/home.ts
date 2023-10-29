import { useCallback } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { hash } from "./kind"
import type LocationProps from "./LocationProps"

function returnTo(props: LocationProps, hash = props.location.hash) {
  const returnTo = props.searchParams.get("returnTo")
  const to = returnTo ? decodeURIComponent(returnTo).replace(/#\w+/, "") : props.location.pathname
  props.navigate(to + hash)
}

export default function navigateToHome(props: LocationProps) {
  returnTo(props, props.location.hash ?? hash("taskqueues"))
}

export function navigateToWorkerPools(props: LocationProps) {
  returnTo(props, hash("workerpools"))
}

export function returnHomeCallback() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  return useCallback(() => navigateToHome({ location, navigate, searchParams }), [location, navigate, searchParams])
}

export function returnToWorkerPoolsCallback() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  return useCallback(
    () => navigateToWorkerPools({ location, navigate, searchParams }),
    [location, navigate, searchParams],
  )
}
