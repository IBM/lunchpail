import isUrl from "is-url-superb"
import { isValidElement, lazy, Suspense } from "react"
import {
  Button,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListTermHelpText,
  DescriptionListTermHelpTextButton,
  DescriptionListDescription,
  List,
  ListItem,
  Truncate,
} from "@patternfly/react-core"

const Popover = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.Popover })))

import type { ReactNode } from "react"
import type { DescriptionListProps } from "@patternfly/react-core"

import SmallLabel from "./SmallLabel"
import { stopPropagation } from "../navigate"

import YesIcon from "@patternfly/react-icons/dist/esm/icons/check-icon"
import NoIcon from "@patternfly/react-icons/dist/esm/icons/minus-icon"
import LinkIcon from "@patternfly/react-icons/dist/esm/icons/external-link-square-alt-icon"

const imageRepoUrlPattern = /^ghcr\.io/
function isImageRepoUrl(str: string) {
  return imageRepoUrlPattern.test(str)
}

const httpPattern = /^https?:/
function httpsIfNeeded(url: string) {
  if (!httpPattern.test(url)) {
    return "https://" + url
  } else {
    return url
  }
}

const noLeftPadding = { paddingLeft: 0 }

function dd(description: ReactNode | Record<string, string>) {
  if (description === true || description === false) {
    return description ? (
      <YesIcon className="codeflare--status-online" />
    ) : (
      <NoIcon className="codeflare--status-offline" />
    )
  } else if (typeof description === "string" && (isUrl(description) || isImageRepoUrl(description))) {
    return (
      <Button
        variant="link"
        target="_blank"
        icon={<LinkIcon />}
        iconPosition="right"
        href={httpsIfNeeded(description)}
        component="a"
        style={
          noLeftPadding /* isInline is the nominal way to do this, but it is not compatible with our use of Truncate */
        }
      >
        <Truncate content={description} />
      </Button>
    )
  } else if (description && typeof description === "object" && !isValidElement(description)) {
    if (Array.isArray(description)) {
      return description.flatMap((item, idx) => [idx > 0 ? ", " : "", item])
    } else {
      const entries = Object.entries(description).filter(([, value]) => !!value)
      if (entries.length > 0) {
        return (
          <List isPlain isBordered>
            {entries.map(([key, value]) => (
              <ListItem key={key}>{value}</ListItem>
            ))}
          </List>
        )
      }
    }
  } else {
    return description
  }
  return null
}

function dt(term: ReactNode, count?: number | string, helperText?: string) {
  const termUI = (
    <span className="codeflare--capitalize">{typeof term === "string" ? term.replace(/-/g, " ") : dd(term)}</span>
  )
  const label = count === undefined ? termUI : <SmallLabel count={count}>{termUI}</SmallLabel>

  if (!helperText) {
    return <DescriptionListTerm>{label}</DescriptionListTerm>
  } else {
    return (
      <DescriptionListTermHelpText>
        <Suspense fallback={<div />}>
          <Popover headerContent={label} bodyContent={helperText}>
            <DescriptionListTermHelpTextButton onClick={stopPropagation}>{label}</DescriptionListTermHelpTextButton>
          </Popover>
        </Suspense>
      </DescriptionListTermHelpText>
    )
  }
}

export function descriptionGroup(
  term: ReactNode,
  description: ReactNode | Record<string, string>,
  count?: number | string,
  helperText?: string,
) {
  const desc = dd(description)
  if (desc != null && desc !== undefined) {
    // re: data-ouia-component-type: DescriptionListGroup does not yet support ouia-component-type
    // also no ouiaId support, hence data-ouia-component-id
    return (
      <DescriptionListGroup
        key={String(term)}
        data-ouia-component-type="PF5/DescriptionListGroup"
        data-ouia-component-id={String(term)}
      >
        {dt(term, count, helperText)}
        <DescriptionListDescription>{desc}</DescriptionListDescription>
      </DescriptionListGroup>
    )
  }
  return null
}

export function dl(props: { groups: ReactNode[]; props?: DescriptionListProps; ouiaId?: string }) {
  // re: data-ouia-component-type: DescriptionList does not yet support ouia-component-type
  return (
    <DescriptionList
      {...props.props}
      data-ouia-component-type="PF5/DescriptionList"
      data-ouia-component-id={props.ouiaId}
    >
      {props.groups}
    </DescriptionList>
  )
}
