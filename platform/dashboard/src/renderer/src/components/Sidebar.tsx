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
      {props.providers.map(({ kind, name, sidebar }) => {
        return (
          <NavItem key={kind} to={hashIfNeeded(kind)} isActive={isShowingKind(kind)}>
            {name}{" "}
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

function SidebarNavGroup(props: Props & { group: string; providers: NavigableContentProvider[] }) {
  if (props.group === "root") {
    // render these at the top-level, without a surrounding NavGroup/NavExpandable
    return <SidebarNavItems key={props.group} {...props} providers={props.providers} />
  } else {
    // otherwise, wrap the nav items inside a NavExpandable (which is
    // a NavGroup that can be expanded)
    return (
      <NavExpandable title={props.group} key={props.group} isExpanded={props.group !== "Advanced"}>
        <SidebarNavItems {...props} providers={props.providers} />
      </NavExpandable>
    )
  }
}

function prio(provider: ContentProvider) {
  return provider.sidebar === true ? 10 : provider.sidebar?.priority ?? 0
}

function SidebarNav(props: Props) {
  const groups = useMemo(
    () =>
      Object.values(providers)
        .sort((a, b) => prio(b) - prio(a) || a.name.localeCompare(b.name))
        .reduce(
          (G, provider) => {
            // if provider.sidebar is `true`, then place at the root of the tree
            // if provider.sidebar is defined, then use provider.sidebar.group or "root"
            // otherwise, do not place this ContentProvider in the Sidebar
            const group =
              provider.sidebar === true ? "root" : provider.sidebar ? provider.sidebar?.group ?? "root" : undefined
            if (group) {
              if (!(group in G)) {
                G[group] = []
              }
              G[group].push(provider as NavigableContentProvider)
            }
            return G
          },
          {} as Record<string, NavigableContentProvider[]>,
        ),
    [providers],
  )

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
