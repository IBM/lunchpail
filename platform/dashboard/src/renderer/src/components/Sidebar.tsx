import { useMemo } from "react"
import { Badge, PageSidebar, PageSidebarBody, Nav, NavExpandable, NavItem, NavList } from "@patternfly/react-core"

import providers from "../content/providers"
import type ContentProvider from "../content/ContentProvider"
import type NavigableKind from "../content/NavigableKind"

import Configuration from "./Configuration"
import isShowingKind, { hashIfNeeded } from "../navigate/kind"

import "./Sidebar.scss"

type NavigableContentProvider = ContentProvider<NavigableKind>

type Props = Record<NavigableKind, number>
const marginLeft = { marginLeft: "0.5em" as const }

function SidebarNavItems(props: Props & { providers: NavigableContentProvider[] }) {
  return (
    <>
      {props.providers.map(({ kind, name, title, sidebar }) => {
        return (
          <NavItem key={kind} to={hashIfNeeded(kind)} isActive={isShowingKind(kind)} ouiaId={kind + "." + name}>
            {title ?? name}{" "}
            <Badge isRead style={marginLeft}>
              {props[kind]} {typeof sidebar === "object" && sidebar.badgeSuffix}
            </Badge>
          </NavItem>
        )
      })}
    </>
  )
}

function SidebarHelloNavGroup() {
  /*return (
    <NavItem to="#controlplane" isActive={isShowingKind("controlplane")}>
      {nonResourceNames.controlplane}
      <span style={marginLeft} />
      <ControlPlaneHealthBadge />
    </NavItem>
    )*/
  return <></>
}

function isRoot(provider: ContentProvider) {
  return provider.sidebar === true || !provider.sidebar?.group
}

function SidebarNavGroup(props: Props & { group: string; providers: NavigableContentProvider[] }) {
  if (props.providers.every(isRoot)) {
    // render these at the top-level, without a surrounding NavGroup/NavExpandable
    return <SidebarNavItems key={props.group} {...props} providers={props.providers} />
  } else {
    // otherwise, wrap the nav items inside a NavExpandable (which is
    // a NavGroup that can be expanded)
    return (
      <NavExpandable title={props.group} key={props.group} isExpanded>
        <SidebarNavItems {...props} providers={props.providers} />
      </NavExpandable>
    )
  }
}

function prio(provider: ContentProvider) {
  return provider.sidebar === true ? 0 : provider.sidebar?.priority ?? 0
}

function sortName({ title, name, sidebar }: ContentProvider) {
  return !sidebar ? "" : sidebar === true ? title ?? name : sidebar.group ?? title ?? name
}

/** Sort children within a node in the tree (lexicographically on `sortName`) */
function sorter2(a: ContentProvider, b: ContentProvider) {
  return (a.title ?? a.name).localeCompare(b.title ?? b.name)
}

/** Sort into the tree order */
function sorter(a: ContentProvider, b: ContentProvider) {
  // priority within tree, with a tiebreaker of lexicographic sort order
  return prio(b) - prio(a) || sorter2(a, b)
}

function SidebarNav(props: Props) {
  const groups = useMemo(() => {
    // first, group the providers
    const groups = Object.values(providers)
      .sort(sorter)
      .reduce(
        (G, provider) => {
          // group the providers
          const group = sortName(provider)
          if (group) {
            if (!(group in G)) {
              G[group] = []
            }
            G[group].push(provider as NavigableContentProvider)
          }
          return G
        },
        {} as Record<string, NavigableContentProvider[]>,
      )

    // then, sort the providers within each group
    return Object.entries(groups).reduce(
      (G, [groupName, providers]) => {
        G[groupName] = providers.sort(sorter)
        return G
      },
      {} as Record<string, NavigableContentProvider[]>,
    )
  }, [providers])

  return (
    <Nav>
      <NavList>
        <SidebarHelloNavGroup />
        {Object.entries(groups).map(([group, providers]) => (
          <SidebarNavGroup key={group} {...props} group={group} providers={providers} />
        ))}
      </NavList>
    </Nav>
  )
}

export default function Sidebar(props: Props) {
  return (
    <PageSidebar className="codeflare--page-sidebar">
      <PageSidebarBody isFilled>
        <SidebarNav {...props} />
      </PageSidebarBody>

      <PageSidebarBody isFilled={false}>
        <Configuration />
      </PageSidebarBody>
    </PageSidebar>
  )
}
