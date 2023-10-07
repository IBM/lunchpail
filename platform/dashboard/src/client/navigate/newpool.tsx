import { Link } from "react-router-dom"
import { Button } from "@patternfly/react-core"

import { stopPropagation } from "."

import type { LocationProps } from "../router/withLocation"

import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon"
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon"

type StartOrAdd = "start" | "add" | "create"

function href(dataset?: string, returnTo?: string, hash?: string) {
  const queries = [
    "view=newpool",
    dataset ? `dataset=${dataset}` : undefined,
    returnTo ? `returnTo=${returnTo}` : undefined,
  ].filter(Boolean)

  return "?" + queries.join("&") + (hash ?? "")
}

export default function isShowingNewPool(props: Pick<LocationProps, "searchParams">) {
  return props.searchParams.get("view") === "newpool"
}

function routerToNewPool(props: {
  "data-hash": string
  "data-dataset": string
  "data-return-to": string
  "data-start-or-add": StartOrAdd
}) {
  const hash = props["data-hash"]
  const dataset = props["data-dataset"]
  const returnTo = props["data-return-to"]
  const start = props["data-start-or-add"]

  const icon = start === "start" ? <RocketIcon /> : <PlusCircleIcon />
  const linkText =
    start === "start" ? "Process these Tasks" : start === "add" ? "Add a Worker Pool" : "Create Worker Pool"

  return (
    <Link {...props} to={href(dataset, returnTo, hash)}>
      <span className="pf-v5-c-button__icon pf-m-start">{icon}</span> {linkText}
    </Link>
  )
}

/**
 * @return a UI component that links to the `NewWorkerPoolWizard`. If
 * `startOrAdd` is `start`, then present the UI as if this were the
 * first time we were asking to process the given `dataset`;
 * otherwise, present as if we are augmenting existing computational
 * resources.
 */
export function linkToNewPool(
  dataset: string | undefined,
  { location, searchParams }: Omit<LocationProps, "navigate">,
  startOrAdd: StartOrAdd = "start",
  buttonProps?: import("@patternfly/react-core").ButtonProps,
) {
  const currentHash = location.hash
  const currentSearch = searchParams
  const returnTo = encodeURIComponent(`?${currentSearch}`)

  return (
    <Button
      {...buttonProps}
      size="sm"
      onClick={stopPropagation}
      data-dataset={dataset}
      data-start-or-add={startOrAdd}
      data-hash={currentHash}
      data-return-to={returnTo}
      component={routerToNewPool}
    />
  )
}
