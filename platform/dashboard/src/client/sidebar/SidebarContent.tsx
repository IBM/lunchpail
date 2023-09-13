import { PageSidebar, PageSidebarBody } from "@patternfly/react-core"
import { PureComponent, ReactNode } from "react"
import {
  FilterSidePanel,
  FilterSidePanelCategory,
  FilterSidePanelCategoryItem,
} from "@patternfly/react-catalog-view-extension"
import "@patternfly/react-catalog-view-extension/dist/sass/_react-catalog-view-extension.scss"
import { ActiveFitlersCtx, ActiveFilters } from "../context/FiltersContext"

type ShowAllCategories = {
  ds: boolean
  wp: boolean
}

interface Props {
  datasetNames: string[]
  workerpoolNames: string[]
}

interface State {
  showAllCategories: ShowAllCategories
}

export class SidebarContent extends PureComponent<Props, State> {
  public constructor(props: Props) {
    super(props)
    this.state = {
      showAllCategories: {
        ds: false,
        wp: false,
      },
    }
  }

  private onShowAllToggle(id: "ds" | "wp") {
    const showAllCategories: ShowAllCategories = { ...this.state?.showAllCategories }
    showAllCategories[id] = !showAllCategories[id]
    this.setState({ showAllCategories })
  }

  private categoryItems = (category: string[], whichFilter: string, actFilters: ActiveFilters) => {
    let allActiveSets: string[] = []

    if (whichFilter === "datasets") {
      allActiveSets = actFilters?.datasets
    } else if (whichFilter === "workerpools") {
      allActiveSets = actFilters?.workerpools
    }

    return (
      <>
        {category.map((name: string, idx: number) => (
          <FilterSidePanelCategoryItem
            key={name + idx}
            title={name}
            checked={allActiveSets.includes(name)}
            // onClick={(e) => this.onFilterChange(e, whichFilter)}
          >
            {name}
          </FilterSidePanelCategoryItem>
        ))}
      </>
    )
  }

  private filterContent(maxShowCount: number, leeway: number): ReactNode {
    return (
      <FilterSidePanel id="filter-panel">
        <FilterSidePanelCategory
          key="cat1"
          title="Datasets"
          maxShowCount={maxShowCount}
          leeway={leeway}
          showAll={this.state.showAllCategories.ds}
          onShowAllToggle={() => this.onShowAllToggle("ds")}
        >
          <ActiveFitlersCtx.Consumer>
            {(value) => this.categoryItems(this.props.datasetNames, "datasets", value)}
          </ActiveFitlersCtx.Consumer>
        </FilterSidePanelCategory>
        <FilterSidePanelCategory
          key="cat2"
          title="Worker Pools"
          maxShowCount={maxShowCount}
          leeway={leeway}
          showAll={this.state.showAllCategories.wp}
          onShowAllToggle={() => this.onShowAllToggle("wp")}
        >
          <ActiveFitlersCtx.Consumer>
            {(value) => this.categoryItems(this.props.workerpoolNames, "workerpools", value)}
          </ActiveFitlersCtx.Consumer>
        </FilterSidePanelCategory>
      </FilterSidePanel>
    )
  }

  public render() {
    // Variables to assist with rendering
    const maxShowCount = 5
    const leeway = 2
    return (
      <PageSidebar className="codeflare--page-sidebar" isSidebarOpen={true}>
        <PageSidebarBody>{this.filterContent(maxShowCount, leeway)}</PageSidebarBody>
      </PageSidebar>
    )
  }
}
