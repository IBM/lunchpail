import { Badge, PageSidebar, PageSidebarBody, Nav, NavExpandable, NavItem, NavList } from "@patternfly/react-core"

import names from "../names"
import isShowingKind, { hashIfNeeded } from "../navigate/kind"

import type { LocationProps } from "../router/withLocation"
import type { ActiveFilters } from "../context/FiltersContext"

import "./SidebarContent.scss"

type Props = Pick<LocationProps, "location"> & {
  appMd5: string
  applications: string[]
  datasets: string[]
  workerpools: string[]
  filterState?: ActiveFilters
}

const resourceLabels = {
  datasets: names["datasets"],
  workerpools: names["workerpools"],
  applications: names["applications"],
}

const marginLeft = { marginLeft: "1em" as const }

function SidebarResourceNavItems(props: Props) {
  return (
    <>
      {Object.entries(resourceLabels).map(([kindStr, name]) => {
        const kind = kindStr as keyof typeof resourceLabels // typescript insufficiency
        return (
          <NavItem key={kind} to={hashIfNeeded(kind)} isActive={isShowingKind(kind, props)}>
            {name}{" "}
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
      <SidebarResourceNavItems {...props} />
    </NavExpandable>
  )
}

function SidebarCredentialsNavItems() {
  return <></>
}

function SidebarCredentialsNavGroup() {
  return (
    <NavExpandable title="Credentials">
      <SidebarCredentialsNavItems />
    </NavExpandable>
  )
}

function SidebarNav(props: Props) {
  return (
    <Nav>
      <NavList>
        <SidebarResourcesNavGroup {...props} />
        <SidebarCredentialsNavGroup />
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

  private filtersFor(kind: keyof typeof resourceLabels) {
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
        if (item.id! === resourceLabels.applications) {
          // user clicked on the Applications parent
          this.filters.toggleShowAllApplications()
        } else if (item.id! === resourceLabels.datasets) {
          // user clicked on the Data Sets parent
          this.filters.toggleShowAllDataSets()
        } else if (item.id! === resourceLabels.workerpools) {
          // user clicked on the Worker Pools parent
          this.filters.toggleShowAllWorkerPools()
        }
      } else if (parentItem.id! === resourceLabels.applications) {
        // user clicked on a Data Set
        if (item.checkProps!.checked) {
          this.filters.removeApplicationFromFilter(item.id!)
        } else {
          this.filters.addApplicationToFilter(item.id!)
        }
      } else if (parentItem.id! === resourceLabels.datasets) {
        // user clicked on a Data Set
        if (item.checkProps!.checked) {
          this.filters.removeDataSetFromFilter(item.id!)
        } else {
          this.filters.addDataSetToFilter(item.id!)
        }
      } else if (parentItem.id! === resourceLabels.workerpools) {
        // user clicked on a Worker Pool
        if (item.checkProps!.checked) {
          this.filters.removeWorkerPoolFromFilter(item.id!)
        } else {
          this.filters.addWorkerPoolToFilter(item.id!)
        }
      }
    }
  }

  private allAreChecked(kind: keyof typeof resourceLabels) {
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

  private thisOneIsChecked(kind: keyof typeof resourceLabels, name: string) {
    return this.allAreChecked(kind) || (this.filters && this.filtersFor(kind).includes(name))
  }

  private optionsFor(kind: keyof typeof resourceLabels): TreeViewDataItem {
    return {
      id: resourceLabels[kind],
      name: resourceLabels[kind],
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
    return Object.keys(resourceLabels).map((_) => this.optionsFor(_ as keyof typeof resourceLabels))
  }*/
