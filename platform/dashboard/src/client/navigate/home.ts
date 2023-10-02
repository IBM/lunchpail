import type { LocationProps } from "../router/withLocation"

export default function navigateToHome(props: Pick<LocationProps, "location" | "navigate" | "searchParams">) {
  const returnTo = props.searchParams.get("returnTo")
  const to = returnTo ? decodeURIComponent(returnTo) : props.location.pathname + props.location.hash
  props.navigate(to)
}
