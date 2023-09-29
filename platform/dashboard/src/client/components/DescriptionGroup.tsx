import isUrl from "is-url-superb"
import { isValidElement } from "react"
import {
  Button,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  List,
  ListItem,
  Truncate,
} from "@patternfly/react-core"

import type { ReactNode } from "react"

import SmallLabel from "./SmallLabel"

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
      return description.join(",")
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

export function descriptionGroup(
  term: ReactNode,
  description: ReactNode | Record<string, string>,
  count?: number | string,
) {
  const desc = dd(description)
  if (desc != null && desc !== undefined) {
    return (
      <DescriptionListGroup key={String(term)}>
        <DescriptionListTerm>
          <SmallLabel count={count}>
            <span className="codeflare--capitalize">{term}</span>
          </SmallLabel>
        </DescriptionListTerm>
        <DescriptionListDescription>{desc}</DescriptionListDescription>
      </DescriptionListGroup>
    )
  }
}

function nameGroup(name: string) {
  return descriptionGroup("Name", name)
}

export function dl(groups: ReactNode[]) {
  return <DescriptionList displaySize="lg">{groups}</DescriptionList>
}

export function dlWithName(name: string, groups: ReactNode[]) {
  return dl([nameGroup(name), ...groups])
}
