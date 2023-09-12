import { PageSidebar, PageSidebarBody } from "@patternfly/react-core"
import { PureComponent, ReactNode } from "react"
import {
  FilterSidePanel,
  FilterSidePanelCategory,
  FilterSidePanelCategoryItem,
} from "@patternfly/react-catalog-view-extension"
import "@patternfly/react-catalog-view-extension/dist/sass/_react-catalog-view-extension.scss"

type ActiveFiltersType = {
  filterItemName: string
  filterItemStatus: boolean
  filterItemType: string
}[]

type ShowAllCategoriesType = {
  ds: boolean
  wp: boolean
}

interface Props {
  datasetNames: string[]
  workerpoolNames: string[]
}

interface State {
  activeFilters: ActiveFiltersType
  showAllCategories: ShowAllCategoriesType
}

export class SidebarContent extends PureComponent<Props, State> {
  public constructor(props: Props) {
    super(props)
    this.state = {
      activeFilters: [],
      showAllCategories: {
        ds: false,
        wp: false,
      },
    }
  }

  public static getDerivedStateFromProps(props: Props) {
    const result: ActiveFiltersType = []
    props.datasetNames.map((name) => {
      result.push({ filterItemName: name, filterItemStatus: true, filterItemType: "ds" })
    })
    props.workerpoolNames.map((name) => {
      result.push({ filterItemName: name, filterItemStatus: true, filterItemType: "wp" })
    })

    return {
      activeFilters: result,
      showAllCategories: {
        ds: false,
        wp: false,
      },
    }
  }

  private onShowAllToggle(id: "ds" | "wp") {
    const showAllCategories: ShowAllCategoriesType = { ...this.state?.showAllCategories }
    showAllCategories[id] = !showAllCategories[id]
    this.setState({ showAllCategories })
  }

  private categoryItems = (category: string) => {
    return <>{this.state?.activeFilters.map((arrVal, idx) => this.itemRender(arrVal, idx, category))}</>
  }

  private itemRender(
    item: { filterItemName: string; filterItemStatus: boolean; filterItemType: string },
    idx: number,
    category: string,
  ) {
    if (item.filterItemType === category) {
      return (
        <FilterSidePanelCategoryItem key={item.filterItemName + idx} checked={item.filterItemStatus}>
          {item.filterItemName}
        </FilterSidePanelCategoryItem>
      )
    }
  }

  private filterContent(showAllCategories: ShowAllCategoriesType, maxShowCount: number, leeway: number): ReactNode {
    return (
      <FilterSidePanel id="filter-panel">
        <FilterSidePanelCategory
          key="cat2"
          title="Datasets"
          maxShowCount={maxShowCount}
          leeway={leeway}
          showAll={showAllCategories.ds}
          onShowAllToggle={() => this.onShowAllToggle("ds")}
        >
          {this.categoryItems("ds")}
        </FilterSidePanelCategory>
        <FilterSidePanelCategory
          key="cat3"
          title="Worker Pools"
          maxShowCount={maxShowCount}
          leeway={leeway}
          showAll={showAllCategories.wp}
          onShowAllToggle={() => this.onShowAllToggle("wp")}
        >
          {this.categoryItems("wp")}
        </FilterSidePanelCategory>
      </FilterSidePanel>
    )
  }

  public render() {
    const { showAllCategories } = this.state
    const maxShowCount = 5
    const leeway = 2
    return (
      <PageSidebar className="codeflare--page-sidebar" isSidebarOpen={true}>
        <PageSidebarBody>{this.filterContent(showAllCategories, maxShowCount, leeway)}</PageSidebarBody>
      </PageSidebar>
    )
  }
}
