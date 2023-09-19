import { createContext } from "react"

export type ActiveFilters = {
  datasets: string[]
  workerpools: string[]
  showingAllDataSets: boolean
  showingAllWorkerPools: boolean

  addDataSetToFilter: (arg: string) => void
  addWorkerPoolToFilter: (arg: string) => void
  removeDataSetFromFilter: (arg: string) => void
  removeWorkerPoolFromFilter: (arg: string) => void
  toggleShowAllDataSets(): void
  toggleShowAllWorkerPools(): void
  clearAllFilters: () => void
}

export const initialState: ActiveFilters = {
  datasets: [],
  workerpools: [],
  showingAllDataSets: false,
  showingAllWorkerPools: false,

  addDataSetToFilter: () => {},
  addWorkerPoolToFilter: () => {},
  removeDataSetFromFilter: () => {},
  removeWorkerPoolFromFilter: () => {},
  toggleShowAllDataSets() {},
  toggleShowAllWorkerPools() {},
  clearAllFilters: () => {},
}

export const ActiveFitlersCtx = createContext<ActiveFilters>(initialState)
