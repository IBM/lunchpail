import React from "react"
import { Chip, ChipGroup } from "@patternfly/react-core"
import { ActiveFitlersCtx } from "../context/FiltersContext"

export const FilterChips: React.FunctionComponent = () => {
  return (
    <ActiveFitlersCtx.Consumer>
      {(value) => {
        if (!value) return

        const { datasets, workerpools, removeDataSetFromFilter, removeWorkerPoolFromFilter } = value
        return (
          ((datasets && datasets.length > 0) || (workerpools && workerpools.length > 0)) && (
            <>
              {datasets && datasets.length > 0 && (
                <ChipGroup categoryName="Datasets">
                  {datasets.map((currentChip) => (
                    <Chip key={currentChip} onClick={() => removeDataSetFromFilter(currentChip)}>
                      {currentChip}
                    </Chip>
                  ))}
                </ChipGroup>
              )}
              {workerpools && workerpools.length > 0 && (
                <ChipGroup categoryName="Workerpools">
                  {workerpools.map((currentChip) => (
                    <Chip key={currentChip} onClick={() => removeWorkerPoolFromFilter(currentChip)}>
                      {currentChip}
                    </Chip>
                  ))}
                </ChipGroup>
              )}
            </>
          )
        )
      }}
    </ActiveFitlersCtx.Consumer>
  )
}
