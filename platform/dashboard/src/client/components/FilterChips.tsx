import type { FunctionComponent } from "react"
import { Chip, ChipGroup, Flex } from "@patternfly/react-core"

import { ActiveFilters, ActiveFitlersCtx } from "../context/FiltersContext"

function chipGroup(
  categoryName: string,
  items: ActiveFilters["datasets"] | ActiveFilters["workerpools"],
  removeFn: ActiveFilters["removeDataSetFromFilter"] | ActiveFilters["removeWorkerPoolFromFilter"],
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

const FilterChips: FunctionComponent = () => {
  return (
    <ActiveFitlersCtx.Consumer>
      {(value) =>
        value && (
          <Flex>
            {chipGroup("Data Sets", value.datasets, value.removeDataSetFromFilter)}
            {chipGroup("Worker Pools", value.workerpools, value.removeWorkerPoolFromFilter)}
          </Flex>
        )
      }
    </ActiveFitlersCtx.Consumer>
  )
}

export default FilterChips
