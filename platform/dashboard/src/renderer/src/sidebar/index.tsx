import { Badge, PageSidebar, PageSidebarBody, Nav, NavExpandable, NavItem, NavList } from "@patternfly/react-core"

import { type NavigableKind } from "../Kind"
import Configuration from "../components/Configuration"
import isShowingKind, { hashIfNeeded } from "../navigate/kind"
import providers, { type ContentProvider } from "../content/providers"
import ControlPlaneHealthBadge from "../content/controlplane/components/HealthBadge"

import "./Sidebar.scss"

type NavigableContentProvider = ContentProvider<NavigableKind>

type Props = Record<Exclude<NavigableKind, "controlplane">, number>
const marginLeft = { marginLeft: "0.5em" as const }

function SidebarNavItems(props: Props & { providers: NavigableContentProvider[] }) {
  return (
    <>
      {props.providers.map(({ kind, name }) => {
        return (
          <NavItem key={kind} to={hashIfNeeded(kind)} isActive={isShowingKind(kind)}>
            {name}{" "}
            {kind in props ? (
              <Badge isRead style={marginLeft}>
                {props[kind]}
              </Badge>
            ) : (
              <>
                <span style={marginLeft} />
                <ControlPlaneHealthBadge />
              </>
            )}
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
    return <SidebarNavItems key={props.group} {...props} providers={props.providers} />
  } else {
    return (
      <NavExpandable title={props.group} key={props.group}>
        <SidebarNavItems {...props} providers={props.providers} />
      </NavExpandable>
    )
  }
}

function SidebarNav(props: Props) {
  const groups = Object.values(providers).reduce(
    (G, provider) => {
      const group = provider.isInSidebar === true ? "root" : provider.isInSidebar
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
