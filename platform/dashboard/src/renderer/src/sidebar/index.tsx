import { Badge, PageSidebar, PageSidebarBody, Nav, NavExpandable, NavItem, NavList } from "@patternfly/react-core"

import { resourceKinds, credentialsKinds } from "../Kind"
import isShowingKind, { hashIfNeeded } from "../navigate/kind"
import { nonResourceNames, resourceNames, credentialsNames } from "../names"

import type { LocationProps } from "../router/withLocation"
import type { ActiveFilters } from "../context/FiltersContext"

import "./Sidebar.scss"

type Props = Pick<LocationProps, "location"> & {
  appMd5: string
  applications: string[]
  datasets: string[]
  workerpools: string[]
  platformreposecrets: string[]
  filterState?: ActiveFilters
}

const marginLeft = { marginLeft: "1em" as const }

function SidebarNavItems<
  Kinds extends typeof resourceKinds | typeof credentialsKinds,
  Names extends typeof resourceNames | typeof credentialsNames,
>(props: Props & { kinds: Kinds; names: Names }) {
  return (
    <>
      {props.kinds.map((kind) => {
        return (
          <NavItem key={kind} to={hashIfNeeded(kind)} isActive={isShowingKind(kind, props)}>
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

function SidebarHelloNavGroup(props: Pick<Props, "location">) {
  return (
    <NavItem to="#controlplane" isActive={isShowingKind("controlplane", props)}>
      {nonResourceNames.controlplane}
    </NavItem>
  )
}

function SidebarNav(props: Props) {
  return (
    <Nav>
      <NavList>
        <SidebarHelloNavGroup {...props} />
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

/* private filterContent(): ReactNode {
    return (
      <TreeView data={this.options()} onCheck={this.onCheck} hasCheckboxes hasBadges hasGuides defaultAllExpanded />
    )
  }

  private get filters() {
    return this.props.filterState
  }

  private filtersFor(kind: keyof typeof resourceNames) {
    return !this.filters
      ? []
      : kind === "applications"
      ? this.filters.applications
      : kind === "datasets"
      ? this.filters.datasets
      : this.filters.workerpools
  }

  private readonly onCheck = (
    event: React.ChangeEvent<HTMLInputElement>,
    item: TreeViewDataItem,
    parentItem: TreeViewDataItem,
  ) => {
    if (this.filters) {
      if (!parentItem) {
        if (item.id! === resourceNames.applications) {
          // user clicked on the Applications parent
          this.filters.toggleShowAllApplications()
        } else if (item.id! === resourceNames.datasets) {
          // user clicked on the Data Sets parent
          this.filters.toggleShowAllDataSets()
        } else if (item.id! === resourceNames.workerpools) {
          // user clicked on the Worker Pools parent
          this.filters.toggleShowAllWorkerPools()
        }
      } else if (parentItem.id! === resourceNames.applications) {
        // user clicked on a Data Set
        if (item.checkProps!.checked) {
          this.filters.removeApplicationFromFilter(item.id!)
        } else {
          this.filters.addApplicationToFilter(item.id!)
        }
      } else if (parentItem.id! === resourceNames.datasets) {
        // user clicked on a Data Set
        if (item.checkProps!.checked) {
          this.filters.removeDataSetFromFilter(item.id!)
        } else {
          this.filters.addDataSetToFilter(item.id!)
        }
      } else if (parentItem.id! === resourceNames.workerpools) {
        // user clicked on a Worker Pool
        if (item.checkProps!.checked) {
          this.filters.removeWorkerPoolFromFilter(item.id!)
        } else {
          this.filters.addWorkerPoolToFilter(item.id!)
        }
      }
    }
  }

  private allAreChecked(kind: keyof typeof resourceNames) {
    if (this.filters) {
      if (
        (kind === "applications" && this.filters.showingAllApplications) ||
        (kind === "datasets" && this.filters.showingAllDataSets) ||
        (kind === "workerpools" && this.filters.showingAllWorkerPools)
      ) {
        return true
      } else if (this.filtersFor(kind).length > 0) {
        if (this.filtersFor(kind).length === this.props[kind].length) {
          return true
        } else {
          return null
        }
      }
    }

    return false
  }

  private thisOneIsChecked(kind: keyof typeof resourceNames, name: string) {
    return this.allAreChecked(kind) || (this.filters && this.filtersFor(kind).includes(name))
  }

  private optionsFor(kind: keyof typeof resourceNames): TreeViewDataItem {
    return {
      id: resourceNames[kind],
      name: resourceNames[kind],
      hasCheckbox: this.props[kind].length > 0,
      checkProps: { "aria-label": `${kind}-check`, checked: this.allAreChecked(kind) },
      children: this.props[kind].map((name) => ({
        id: name,
        name,
        checkProps: { "aria-label": `${kind}-${name}-check`, checked: this.thisOneIsChecked(kind, name) },
      })),
    }
  }

  private options() {
    return Object.keys(resourceNames).map((_) => this.optionsFor(_ as keyof typeof resourceNames))
  }*/
