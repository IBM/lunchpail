import { createContext } from "react"

export type ActiveFilters = {
  applications: string[]
  datasets: string[]
  workerpools: string[]
  showingAllApplications: boolean
  showingAllDataSets: boolean
  showingAllWorkerPools: boolean

  addApplicationToFilter: (arg: string) => void
  addDataSetToFilter: (arg: string) => void
  addWorkerPoolToFilter: (arg: string) => void

  removeApplicationFromFilter: (arg: string) => void
  removeDataSetFromFilter: (arg: string) => void
  removeWorkerPoolFromFilter: (arg: string) => void

  toggleShowAllApplications(): void
  toggleShowAllDataSets(): void
  toggleShowAllWorkerPools(): void

  clearAllFilters: () => void
}

export const initialState: ActiveFilters = {
  applications: [],
  datasets: [],
  workerpools: [],

  showingAllApplications: false,
  showingAllDataSets: false,
  showingAllWorkerPools: false,

  addApplicationToFilter: () => {},
  addDataSetToFilter: () => {},
  addWorkerPoolToFilter: () => {},

  removeApplicationFromFilter: () => {},
  removeDataSetFromFilter: () => {},
  removeWorkerPoolFromFilter: () => {},

  toggleShowAllApplications() {},
  toggleShowAllDataSets() {},
  toggleShowAllWorkerPools() {},

  clearAllFilters: () => {},
}

export const ActiveFitlersCtx = createContext<ActiveFilters>(initialState)
