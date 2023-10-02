import { Link } from "react-router-dom"
import { Button } from "@patternfly/react-core"

import { stopPropagation } from "."

import type { LocationProps } from "../router/withLocation"

import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon"

function href(dataset: string, returnTo: string) {
  return `?dataset=${dataset}&returnTo=${returnTo}&view=newpool`
}

export default function isShowingNewPool(props: Pick<LocationProps, "searchParams">) {
  return props.searchParams.get("view") === "newpool"
}

function routerToNewPool(props: { "data-dataset": string; "data-return-to": string }) {
  const dataset = props["data-dataset"]
  const returnTo = props["data-return-to"]
  return (
    <Link {...props} to={href(dataset, returnTo)}>
      <span className="pf-v5-c-button__icon pf-m-start">
        <RocketIcon />
      </span>{" "}
      Process these Tasks
    </Link>
  )
}

export function linkToNewPool(dataset: string, props: Omit<LocationProps, "navigate">) {
  const currentHash = props.location.hash
  const currentSearch = props.searchParams
  const returnTo = encodeURIComponent(`?${currentSearch}${currentHash}`)

  return (
    <Button
      size="sm"
      onClick={stopPropagation}
      data-dataset={dataset}
      data-return-to={returnTo}
      component={routerToNewPool}
    />
  )
}
