import { createContext } from "react"

export type ActiveFilters = {
  datasets: string[]
  workerpools: string[]
  addDataSetToFilter: (arg: string) => void
  addWorkerPoolToFilter: (arg: string) => void
  removeDataSetFromFilter: (arg: string) => void
  removeWorkerPoolFromFilter: (arg: string) => void
  clearAllFilters: () => void
}

export const initialState: ActiveFilters = {
  datasets: [],
  workerpools: [],
  addDataSetToFilter: () => {},
  addWorkerPoolToFilter: () => {},
  removeDataSetFromFilter: () => {},
  removeWorkerPoolFromFilter: () => {},
  clearAllFilters: () => {},
}

export const ActiveFitlersCtx = createContext<ActiveFilters>(initialState)
