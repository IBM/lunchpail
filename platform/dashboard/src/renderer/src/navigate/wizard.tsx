import { Link, useLocation, useSearchParams } from "react-router-dom"
import { Button, Flex, FlexItem, Tooltip } from "@patternfly/react-core"

import type Kind from "../Kind"
import { stopPropagation } from "."

import FixIcon from "@patternfly/react-icons/dist/esm/icons/first-aid-icon"
import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon"
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon"

type StartOrAdd = "start" | "add" | "create" | "fix"

/** URI ?view=wizard */
const view = "wizard"

export function isShowingWizard(kind?: Kind): Kind | void {
  const searchParams = useSearchParams()[0]
  const currentView = searchParams.get("view")
  const currentKind = searchParams.get("kind")
  if (currentView === view && (!kind || currentKind === kind)) {
    return currentKind as Kind
  }
}

function href(kind: Kind, returnTo?: string, hash?: string, qs: string[] = []) {
  const queries = [`view=${view}`, `kind=${kind}`, ...qs, returnTo ? `returnTo=${returnTo}` : undefined].filter(Boolean)

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
  kind: Kind
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
  const theHref = href(props.kind, returnTo, currentHash, props.qs)

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
