import type { FunctionComponent } from "react"
import { Chip, ChipGroup, Flex } from "@patternfly/react-core"

import { ActiveFilters, ActiveFitlersCtx } from "../context/FiltersContext"

/**
 * Note: we need to pass these in separately, and not pull them from
 * ActiveFiltersCtx, because the user may have opted to Show All,
 * which needs to be responsive to the dynamic addition of new
 * elements not present when the user first clicked Show All. These
 * are the elements to be presented as Chips.
 */
type Props = {
  applications: string[]
  datasets: string[]
  workerpools: string[]
}

function chipGroup(
  categoryName: string,
  items: ActiveFilters["applications"] | ActiveFilters["datasets"] | ActiveFilters["workerpools"],
  removeFn:
    | ActiveFilters["removeApplicationFromFilter"]
    | ActiveFilters["removeDataSetFromFilter"]
    | ActiveFilters["removeWorkerPoolFromFilter"],
) {
  return (
    items &&
    items.length > 0 && (
      <ChipGroup categoryName={categoryName}>
        {items.map((currentChip) => (
          <Chip key={currentChip} onClick={() => removeFn(currentChip)}>
            {currentChip}
          </Chip>
        ))}
      </ChipGroup>
    )
  )
}

const FilterChips: FunctionComponent<Props> = (props: Props) => {
  return (
    <ActiveFitlersCtx.Consumer>
      {(value) =>
        value && (
          <Flex>
            {chipGroup("Applications", props.applications, value.removeApplicationFromFilter)}
            {chipGroup("Data Sets", props.datasets, value.removeDataSetFromFilter)}
            {chipGroup("Worker Pools", props.workerpools, value.removeWorkerPoolFromFilter)}
          </Flex>
        )
      }
    </ActiveFitlersCtx.Consumer>
  )
}

export default FilterChips
