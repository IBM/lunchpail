import { Link, useLocation, useSearchParams } from "react-router-dom"
import { Button, Flex, FlexItem, Tooltip, type ButtonProps } from "@patternfly/react-core"

import type Kind from "../content/NavigableKind"
import type LocationProps from "./LocationProps"

import { stopPropagation } from "."

import FixIcon from "@patternfly/react-icons/dist/esm/icons/first-aid-icon"
import EditIcon from "@patternfly/react-icons/dist/esm/icons/edit-icon"
import CloneIcon from "@patternfly/react-icons/dist/esm/icons/clone-icon"
// import RocketIcon from "@patternfly/react-icons/dist/esm/icons/rocket-icon"
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon"

type StartOrAdd = "start" | "add" | "create" | "fix" | "edit" | "clone"

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

const actionEqual = /action=/

function href(kind: Kind, startOrAdd?: StartOrAdd, returnTo?: string, hash?: string, qs: string[] = []) {
  const ourqs = !startOrAdd || qs.find((_) => actionEqual.test(_)) ? qs : [...qs, `action=${startOrAdd}`]
  const queries = [`view=${view}`, `kind=${kind}`, ...ourqs, returnTo ? `returnTo=${returnTo}` : undefined].filter(
    Boolean,
  )

  return "?" + queries.join("&") + (hash ?? "")
}

const gapSm = { default: "gapSm" as const }
const noWrap = { default: "nowrap" as const }

/** A React component that will offer a Link to a given `data-href` */
function linker(props: {
  "data-href": string
  "data-link-text": string
  "data-start-or-add": StartOrAdd
  linkText?: string
}) {
  const href = props["data-href"]
  const start = props["data-start-or-add"]

  const icon =
    start === "start" ? undefined : start === "fix" ? ( // <RocketIcon />
      <FixIcon />
    ) : start === "edit" ? (
      <EditIcon />
    ) : start === "clone" ? (
      <CloneIcon />
    ) : (
      <PlusCircleIcon />
    )
  const linkText = props["data-link-text"]

  // remove linkText as <Link> isn't happy with it
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { linkText: ignore, ...linkProps } = props

  return (
    <Link {...linkProps} to={href}>
      {!icon ? (
        linkText
      ) : (
        <Flex gap={gapSm} flexWrap={noWrap}>
          {icon && <FlexItem>{icon}</FlexItem>}
          {linkText && <FlexItem>{linkText}</FlexItem>}
        </Flex>
      )}
    </Link>
  )
}

type LinkerProps = {
  kind: Kind
  linkText: string
  isInline?: boolean
  qs: string[]
}

export function linkerButtonProps({ location, searchParams }: Omit<LocationProps, "navigate">, props: LinkerProps) {
  const currentHash = location.hash
  const currentSearch = searchParams.toString()

  const returnTo = encodeURIComponent(`?${currentSearch}`)
  const theHref = href(props.kind, "create", returnTo, currentHash, props.qs)

  return {
    "data-start-or-add": "create",
    "data-link-text": props.linkText,
    "data-href": theHref,
    onClick: stopPropagation,
    linkText: props.linkText,
    component: linker,
  }
}

/** Base/public props for subclasses */
export type WizardProps = ButtonProps & {
  startOrAdd?: StartOrAdd

  /** Optional Button onClick handler, defaults to `evt.stopPropagation` */
  onClick?: (evt: import("react").MouseEvent<HTMLButtonElement>) => void
}

/** Internal props */
type Props = WizardProps & LinkerProps

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
  const theHref = href(props.kind, props.startOrAdd, returnTo, currentHash, props.qs)

  const button = (
    <Button
      isInline={props.isInline}
      variant={
        props.variant
          ? props.variant
          : props.isInline
            ? "link"
            : props.startOrAdd === "fix"
              ? "danger"
              : props.startOrAdd === "clone"
                ? "secondary"
                : "primary"
      }
      size={props.size ?? "sm"}
      onClick={props.onClick ?? stopPropagation}
      data-start-or-add={props.startOrAdd || "start"}
      data-link-text={props.linkText}
      data-href={theHref}
      component={linker}
    />
  )

  const tooltip =
    props.startOrAdd === "fix"
      ? "Attempt this suggested quick fix"
      : props.startOrAdd === "clone"
        ? "Clone this resource"
        : props.startOrAdd === "edit"
          ? "Edit this resource"
          : undefined

  if (tooltip) {
    return <Tooltip content={tooltip}>{button}</Tooltip>
  } else {
    return button
  }
}

/**
 * Convenience wrapper around LinkToNewWizard
 */
export function LinkToNewResource(
  props: Pick<WizardProps, "startOrAdd"> & {
    kind: Kind
    singular: string
    namespace?: string
  },
) {
  const qs: string[] = []
  if (props.namespace) {
    qs.push(`namespace=${props.namespace}`)
  }
  return (
    <LinkToNewWizard
      startOrAdd={props.startOrAdd ?? "add"}
      kind={props.kind}
      linkText={`New ${props.singular}`}
      qs={qs}
    />
  )
}
