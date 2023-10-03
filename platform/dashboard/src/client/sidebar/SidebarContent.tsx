import { PureComponent } from "react"
import { Badge, PageSidebar, PageSidebarBody, Nav, NavList, NavItem } from "@patternfly/react-core"

import names from "../names"
import isShowingKind, { hash } from "../navigate/kind"

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

export default class SidebarContent extends PureComponent<Props> {
  private readonly labels = {
    datasets: names["datasets"],
    workerpools: names["workerpools"],
    applications: names["applications"],
  }

  /* private filterContent(): ReactNode {
    return (
      <TreeView data={this.options()} onCheck={this.onCheck} hasCheckboxes hasBadges hasGuides defaultAllExpanded />
    )
  }

  private get filters() {
    return this.props.filterState
  }

  private filtersFor(kind: keyof typeof this.labels) {
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
        if (item.id! === this.labels.applications) {
          // user clicked on the Applications parent
          this.filters.toggleShowAllApplications()
        } else if (item.id! === this.labels.datasets) {
          // user clicked on the Data Sets parent
          this.filters.toggleShowAllDataSets()
        } else if (item.id! === this.labels.workerpools) {
          // user clicked on the Worker Pools parent
          this.filters.toggleShowAllWorkerPools()
        }
      } else if (parentItem.id! === this.labels.applications) {
        // user clicked on a Data Set
        if (item.checkProps!.checked) {
          this.filters.removeApplicationFromFilter(item.id!)
        } else {
          this.filters.addApplicationToFilter(item.id!)
        }
      } else if (parentItem.id! === this.labels.datasets) {
        // user clicked on a Data Set
        if (item.checkProps!.checked) {
          this.filters.removeDataSetFromFilter(item.id!)
        } else {
          this.filters.addDataSetToFilter(item.id!)
        }
      } else if (parentItem.id! === this.labels.workerpools) {
        // user clicked on a Worker Pool
        if (item.checkProps!.checked) {
          this.filters.removeWorkerPoolFromFilter(item.id!)
        } else {
          this.filters.addWorkerPoolToFilter(item.id!)
        }
      }
    }
  }

  private allAreChecked(kind: keyof typeof this.labels) {
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

  private thisOneIsChecked(kind: keyof typeof this.labels, name: string) {
    return this.allAreChecked(kind) || (this.filters && this.filtersFor(kind).includes(name))
  }

  private optionsFor(kind: keyof typeof this.labels): TreeViewDataItem {
    return {
      id: this.labels[kind],
      name: this.labels[kind],
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
    return Object.keys(this.labels).map((_) => this.optionsFor(_ as keyof typeof this.labels))
  }*/

  private readonly marginLeft = { marginLeft: "1em" }

  private nav() {
    return (
      <Nav>
        <NavList>
          {Object.entries(this.labels).map(([kindStr, name]) => {
            const kind = kindStr as keyof typeof this.labels // typescript insufficiency
            return (
              <NavItem key={kind} to={hash(kind)} isActive={isShowingKind(kind, this.props)}>
                {name}{" "}
                <Badge isRead style={this.marginLeft}>
                  {this.props[kind].length}
                </Badge>
              </NavItem>
            )
          })}
        </NavList>
      </Nav>
    )
  }

  public render() {
    return (
      <PageSidebar className="codeflare--page-sidebar">
        <PageSidebarBody>{this.nav()}</PageSidebarBody>
      </PageSidebar>
    )
  }
}
