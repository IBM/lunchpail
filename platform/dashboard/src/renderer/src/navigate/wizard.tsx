import { Link, useLocation, useSearchParams } from "react-router-dom"
import { Button, Flex, FlexItem, Tooltip } from "@patternfly/react-core"

import { stopPropagation } from "."

import FixIcon from "@patternfly/react-icons/dist/esm/icons/first-aid-icon"
import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon"
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon"

type StartOrAdd = "start" | "add" | "create" | "fix"

/** URI ?view=wizard */
const view = "wizard"

export function isShowingWizard() {
  const searchParams = useSearchParams()[0]
  return searchParams.get("view") === view
}

export function isShowingTask(task: string) {
  const searchParams = useSearchParams()[0]
  return searchParams.get("task") === task
}

function href(task: string, returnTo?: string, hash?: string, qs: string[] = []) {
  const queries = [`view=${view}`, `task=${task}`, ...qs, returnTo ? `returnTo=${returnTo}` : undefined].filter(Boolean)

  return "?" + queries.join("&") + (hash ?? "")
}

const gapSm = { default: "gapSm" as const }
const noWrap = { default: "nowrap" as const }

/** A React component that will offer a Link to a given `data-href` */
function linker(props: { "data-href": string; "data-link-text": string; "data-start-or-add": StartOrAdd }) {
  const href = props["data-href"]
  const start = props["data-start-or-add"]

  const icon = start === "start" ? <RocketIcon /> : start === "fix" ? <FixIcon /> : <PlusCircleIcon />
  const linkText = props["data-link-text"]

  return (
    <Link {...props} to={href}>
      <Flex gap={gapSm} flexWrap={noWrap}>
        <FlexItem>{icon}</FlexItem>
        <FlexItem>{linkText}</FlexItem>
      </Flex>
    </Link>
  )
}

/** Base/public props for subclasses */
export type WizardProps = {
  startOrAdd?: StartOrAdd
}

/** Internal props */
type Props = WizardProps & {
  task: string
  linkText: string
  qs: string[]
}

/**
 * @return a UI component that links to the a wizard `view`. If
 * `startOrAdd` is `start`, then present the UI as if this were the
 * first time we were asking to create such a thing via a wizard;
 * otherwise, present as if we are augmenting an existing thing.
 */
export default function LinkToNewWizard(props: Props) {
  const location = useLocation()
  const currentHash = location.hash
  const currentSearch = useSearchParams()[0]

  const returnTo = encodeURIComponent(`?${currentSearch}`)
  const theHref = href(props.task, returnTo, currentHash, props.qs)

  const button = (
    <Button
      isInline={props.startOrAdd === "create"}
      variant={props.startOrAdd === "create" ? "link" : props.startOrAdd === "fix" ? "danger" : "primary"}
      size="sm"
      onClick={stopPropagation}
      data-start-or-add={props.startOrAdd || "start"}
      data-link-text={props.linkText}
      data-href={theHref}
      component={linker}
    />
  )

  if (props.startOrAdd === "fix") {
    return <Tooltip content="Click here to attempt this suggested quick fix">{button}</Tooltip>
  } else {
    return button
  }
}
