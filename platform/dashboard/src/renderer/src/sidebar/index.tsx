import { Badge, PageSidebar, PageSidebarBody, Nav, NavExpandable, NavItem, NavList } from "@patternfly/react-core"

import { type NavigableKind, resourceKinds, credentialsKinds } from "../Kind"
import isShowingKind, { hashIfNeeded } from "../navigate/kind"
import ControlPlaneHealthBadge from "../components/JobManager/HealthBadge"
import { nonResourceNames, resourceNames, credentialsNames } from "../names"

import "./Sidebar.scss"

type Props = Record<Exclude<NavigableKind, "controlplane">, string[]>
const marginLeft = { marginLeft: "0.5em" as const }

function SidebarNavItems<
  Kinds extends typeof resourceKinds | typeof credentialsKinds,
  Names extends typeof resourceNames | typeof credentialsNames,
>(props: Props & { kinds: Kinds; names: Names }) {
  return (
    <>
      {props.kinds.map((kind) => {
        return (
          <NavItem key={kind} to={hashIfNeeded(kind)} isActive={isShowingKind(kind)}>
            {props.names[kind]}{" "}
            <Badge isRead style={marginLeft}>
              {props[kind].length}
            </Badge>
          </NavItem>
        )
      })}
    </>
  )
}

function SidebarResourcesNavGroup(props: Props) {
  return (
    <NavExpandable title="Resources" isExpanded>
      <SidebarNavItems kinds={resourceKinds} names={resourceNames} {...props} />
    </NavExpandable>
  )
}

function SidebarCredentialsNavGroup(props: Props) {
  return (
    <NavExpandable title="Credentials" isExpanded>
      <SidebarNavItems kinds={credentialsKinds} names={credentialsNames} {...props} />
    </NavExpandable>
  )
}

function SidebarHelloNavGroup() {
  return (
    <NavItem to="#controlplane" isActive={isShowingKind("controlplane")}>
      {nonResourceNames.controlplane}
      <span style={marginLeft} />
      <ControlPlaneHealthBadge />
    </NavItem>
  )
}

function SidebarNav(props: Props) {
  return (
    <Nav>
      <NavList>
        <SidebarHelloNavGroup />
        <SidebarResourcesNavGroup {...props} />
        <SidebarCredentialsNavGroup {...props} />
      </NavList>
    </Nav>
  )
}

export default function Sidebar(props: Props) {
  return (
    <PageSidebar className="codeflare--page-sidebar">
      <PageSidebarBody>
        <SidebarNav {...props} />
      </PageSidebarBody>
    </PageSidebar>
  )
}
