import { PageSidebar, PageSidebarBody, TextInput } from "@patternfly/react-core"
import { PureComponent } from "react"
import {
  FilterSidePanel,
  FilterSidePanelCategory,
  FilterSidePanelCategoryItem,
} from "@patternfly/react-catalog-view-extension"
import StarIcon from "@patternfly/react-icons/dist/esm/icons/star-icon"

type activeFiltersType = {
  typeSUV: boolean
  typeSedan: boolean
  makeChevy: boolean
  makeFord: boolean
  paymentPaypal: boolean
  paymentDiscover: boolean
  mileage50: boolean
  mileage40: boolean
  rating5: boolean
  rating4: boolean
}

type showAllCategoriesType = {
  type: boolean
  make: boolean
  paymentOptions: boolean
  mileage: boolean
  rating: boolean
}

type SidebarStateType = {
  activeFilters: activeFiltersType
  showAllCategories: showAllCategoriesType
}

interface Props {
  isSidebarOpen: boolean
}

export class SidebarContent extends PureComponent<Props, SidebarStateType> {
  public constructor(props: Props) {
    super(props)
    this.state = {
      activeFilters: {
        typeSUV: false,
        typeSedan: false,
        makeChevy: false,
        makeFord: false,
        paymentPaypal: false,
        paymentDiscover: false,
        mileage50: false,
        mileage40: false,
        rating5: false,
        rating4: false,
      },
      showAllCategories: {
        type: false,
        make: false,
        paymentOptions: false,
        mileage: false,
        rating: false,
      },
    }
  }

  public onShowAllToggle(id: "type" | "make" | "paymentOptions" | "mileage" | "rating") {
    const showAllCategories: showAllCategoriesType = { ...this.state.showAllCategories }
    showAllCategories[id] = !showAllCategories[id]
    this.setState({ showAllCategories })
  }

  public onFilterChange = (
    id:
      | "typeSUV"
      | "typeSedan"
      | "makeChevy"
      | "makeFord"
      | "paymentPaypal"
      | "paymentDiscover"
      | "mileage50"
      | "mileage40"
      | "rating5"
      | "rating4",
    value: boolean,
  ) => {
    const activeFilters: activeFiltersType = { ...this.state.activeFilters }
    activeFilters[id] = value
    this.setState({ activeFilters })
  }

  public getStars = (count: number) => {
    const stars = []

    for (let i = 0; i < count; i++) {
      stars.push(<StarIcon key={i} />)
    }

    return (
      <span>
        <span className="pf-v5-u-screen-reader">{`${count} stars`}</span>
        {stars}
      </span>
    )
  }

  public render() {
    const { activeFilters, showAllCategories } = this.state
    const maxShowCount = 5
    const leeway = 2
    return (
      <PageSidebar isSidebarOpen={this.props.isSidebarOpen || false} id="vertical-sidebar">
        <PageSidebarBody>
          <FilterSidePanel id="filter-panel">
            <FilterSidePanelCategory key="cat1">
              <TextInput
                type="text"
                id="filter-text-input"
                placeholder="Filter by name"
                aria-label="filter text input"
              />
            </FilterSidePanelCategory>
            <FilterSidePanelCategory
              key="cat2"
              title="Type"
              maxShowCount={maxShowCount}
              leeway={leeway}
              showAll={showAllCategories.type}
              onShowAllToggle={() => this.onShowAllToggle("type")}
            >
              <FilterSidePanelCategoryItem key="suv" count={23} checked={activeFilters.typeSUV}>
                SUV
              </FilterSidePanelCategoryItem>
              <FilterSidePanelCategoryItem key="sedan" count={11} checked={activeFilters.typeSedan}>
                Sedan
              </FilterSidePanelCategoryItem>
            </FilterSidePanelCategory>
            <FilterSidePanelCategory
              key="cat3"
              title="Manufacturer"
              maxShowCount={maxShowCount}
              leeway={leeway}
              showAll={showAllCategories.make}
              onShowAllToggle={() => this.onShowAllToggle("make")}
            >
              <FilterSidePanelCategoryItem key="chevy" count={6} checked={activeFilters.makeChevy}>
                Chevrolet
              </FilterSidePanelCategoryItem>
              <FilterSidePanelCategoryItem key="ford" count={5} checked={activeFilters.makeFord}>
                Ford
              </FilterSidePanelCategoryItem>
            </FilterSidePanelCategory>
            <FilterSidePanelCategory
              key="cat4"
              title="Payment Options"
              maxShowCount={maxShowCount}
              leeway={leeway}
              showAll={showAllCategories.paymentOptions}
              onShowAllToggle={() => this.onShowAllToggle("paymentOptions")}
            >
              <FilterSidePanelCategoryItem key="pp" checked={activeFilters.paymentPaypal}>
                PayPal
              </FilterSidePanelCategoryItem>
              <FilterSidePanelCategoryItem key="discover" checked={activeFilters.paymentDiscover}>
                Discover
              </FilterSidePanelCategoryItem>
            </FilterSidePanelCategory>
            <FilterSidePanelCategory
              key="cat5"
              title="Fuel Mileage"
              maxShowCount={maxShowCount}
              leeway={leeway}
              showAll={showAllCategories.mileage}
              onShowAllToggle={() => this.onShowAllToggle("mileage")}
            >
              <FilterSidePanelCategoryItem key="gt50" count={3} checked={activeFilters.mileage50}>
                50+
              </FilterSidePanelCategoryItem>
              <FilterSidePanelCategoryItem key="4050" count={7} checked={activeFilters.mileage40}>
                40-50
              </FilterSidePanelCategoryItem>
            </FilterSidePanelCategory>
            <FilterSidePanelCategory
              key="cat6"
              title="Rating"
              maxShowCount={maxShowCount}
              leeway={leeway}
              showAll={showAllCategories.rating}
              onShowAllToggle={() => this.onShowAllToggle("rating")}
            >
              <FilterSidePanelCategoryItem
                key="5star"
                count={2}
                icon={this.getStars(5)}
                checked={activeFilters.rating5}
              />
              <FilterSidePanelCategoryItem
                key="4star"
                count={12}
                icon={this.getStars(4)}
                checked={activeFilters.rating4}
              />
            </FilterSidePanelCategory>
          </FilterSidePanel>
        </PageSidebarBody>
      </PageSidebar>
    )
  }
}
