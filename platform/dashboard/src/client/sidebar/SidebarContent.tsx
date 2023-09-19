import { PureComponent } from "react"
import { PageSidebar, PageSidebarBody, TreeView } from "@patternfly/react-core"

import type { ReactNode } from "react"
import type { TreeViewDataItem } from "@patternfly/react-core"
import type { ActiveFilters } from "../context/FiltersContext"

interface Props {
  datasetNames: string[]
  workerpoolNames: string[]
  filterState?: ActiveFilters
}

export default class SidebarContent extends PureComponent<Props> {
  private readonly labels = {
    datasets: "Data Sets",
    workerpools: "Worker Pools",
  }

  private filterContent(): ReactNode {
    return (
      <TreeView data={this.options()} onCheck={this.onCheck} hasCheckboxes hasBadges hasGuides defaultAllExpanded />
    )
  }

  private get filters() {
    return this.props.filterState
  }

  private readonly onCheck = (
    event: React.ChangeEvent<HTMLInputElement>,
    item: TreeViewDataItem,
    parentItem: TreeViewDataItem,
  ) => {
    if (this.filters) {
      if (!parentItem) {
        if (item.id! === this.labels.datasets) {
          // user clicked on the Data Sets parent
          this.filters.toggleShowAllDataSets()
        } else if (item.id! === this.labels.workerpools) {
          // user clicked on the Worker Pools parent
          this.filters.toggleShowAllWorkerPools()
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

  private options() {
    return [this.datasetOptions(), this.workerpoolOptions()]
  }

  private get allDataSetsIsChecked() {
    if (this.filters) {
      if (this.filters.showingAllDataSets) {
        return true
      } else if (this.filters.datasets.length > 0) {
        if (this.filters.datasets.length === this.props.datasetNames.length) {
          return true
        } else {
          return null
        }
      }
    }

    return false
  }

  private get allWorkerPoolsIsChecked() {
    if (this.filters) {
      if (this.filters.showingAllWorkerPools) {
        return true
      } else if (this.filters.workerpools.length > 0) {
        if (this.filters.workerpools.length === this.props.workerpoolNames.length) {
          return true
        } else {
          return null
        }
      }
    }

    return false
  }

  private thisDataSetIsChecked(name: string) {
    return this.allDataSetsIsChecked || (this.filters && this.filters.datasets.includes(name))
  }

  private thisWorkerPoolIsChecked(name: string) {
    return this.allWorkerPoolsIsChecked || (this.filters && this.filters.workerpools.includes(name))
  }

  private datasetOptions(): TreeViewDataItem {
    return {
      id: this.labels.datasets,
      name: this.labels.datasets,
      checkProps: { "aria-label": `datasets-check`, checked: this.allDataSetsIsChecked },
      children: this.props.datasetNames.map((name) => ({
        id: name,
        name,
        checkProps: { "aria-label": `datasets-${name}-check`, checked: this.thisDataSetIsChecked(name) },
      })),
    }
  }

  private workerpoolOptions(): TreeViewDataItem {
    return {
      id: this.labels.workerpools,
      name: this.labels.workerpools,
      checkProps: { "aria-label": `datasets-check`, checked: this.allWorkerPoolsIsChecked },
      children: this.props.workerpoolNames.map((name) => ({
        id: name,
        name,
        checkProps: { "aria-label": `workerpools-${name}-check`, checked: this.thisWorkerPoolIsChecked(name) },
      })),
    }
  }

  public render() {
    return (
      <PageSidebar className="codeflare--page-sidebar" theme="light">
        <PageSidebarBody>{this.filterContent()}</PageSidebarBody>
      </PageSidebar>
    )
  }
}
