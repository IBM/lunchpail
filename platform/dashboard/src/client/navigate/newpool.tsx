import { Link } from "react-router-dom"
import { Button } from "@patternfly/react-core"

import { stopPropagation } from "."

import type { LocationProps } from "../router/withLocation"

import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon"
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon"

function href(dataset: string, returnTo: string) {
  return `?dataset=${dataset}&returnTo=${returnTo}&view=newpool`
}

export default function isShowingNewPool(props: Pick<LocationProps, "searchParams">) {
  return props.searchParams.get("view") === "newpool"
}

function routerToNewPool(props: {
  "data-dataset": string
  "data-return-to": string
  "data-start-or-add": "start" | "add"
}) {
  const dataset = props["data-dataset"]
  const returnTo = props["data-return-to"]
  const start = props["data-start-or-add"] === "start"

  return (
    <Link {...props} to={href(dataset, returnTo)}>
      <span className="pf-v5-c-button__icon pf-m-start">{start ? <RocketIcon /> : <PlusCircleIcon />}</span>{" "}
      {start ? "Process these Tasks" : "Add a Worker Pool"}
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
  dataset: string,
  props: Omit<LocationProps, "navigate">,
  startOrAdd: "start" | "add" = "start",
) {
  const currentHash = props.location.hash
  const currentSearch = props.searchParams
  const returnTo = encodeURIComponent(`?${currentSearch}${currentHash}`)

  return (
    <Button
      size="sm"
      onClick={stopPropagation}
      data-dataset={dataset}
      data-start-or-add={startOrAdd}
      data-return-to={returnTo}
      component={routerToNewPool}
    />
  )
}
