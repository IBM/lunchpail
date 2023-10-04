import isUrl from "is-url-superb"
import { isValidElement, lazy } from "react"
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

function dd(description: ReactNode | Record<string, string>) {
  if (description === true || description === false) {
    return description ? <YesIcon /> : <NoIcon />
  } else if (typeof description === "string" && isUrl(description)) {
    return (
      <Button variant="link" target="_blank" icon={<LinkIcon />} iconPosition="right" href={description} component="a">
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
}

function dt(term: ReactNode, count?: number | string, helperText?: string) {
  const label = (
    <SmallLabel count={count}>
      <span className="codeflare--capitalize">{term}</span>
    </SmallLabel>
  )

  if (!helperText) {
    return <DescriptionListTerm>{label}</DescriptionListTerm>
  } else {
    return (
      <DescriptionListTermHelpText>
        <Popover headerContent={label} bodyContent={helperText}>
          <DescriptionListTermHelpTextButton onClick={stopPropagation}>{label}</DescriptionListTermHelpTextButton>
        </Popover>
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
    return (
      <DescriptionListGroup key={String(term)}>
        {dt(term, count, helperText)}
        <DescriptionListDescription>{desc}</DescriptionListDescription>
      </DescriptionListGroup>
    )
  }
}

function nameGroup(name: string) {
  return descriptionGroup("Name", name)
}

export function dl(groups: ReactNode[], props?: DescriptionListProps) {
  return <DescriptionList {...props}>{groups}</DescriptionList>
}

export function dlForName(name: string) {
  return dl([nameGroup(name), <div />], { displaySize: "lg", isHorizontal: true, isFluid: true })
}
