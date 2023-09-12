import { createContext } from "react"

export type ActiveFilters = {
  datasets: string[]
  workerpools: string[]
  toggleDataSetFilter: (arg: string) => void
  toggleWorkerPoolFilter: (arg: string) => void
  removeDataSetFromFilter: (arg: string) => void
  removeWorkerPoolFromFilter: (arg: string) => void
  clearAllFilters: () => void
}

const initialState: ActiveFilters = {
  datasets: [],
  workerpools: [],
  toggleDataSetFilter: () => {},
  toggleWorkerPoolFilter: () => {},
  removeDataSetFromFilter: () => {},
  removeWorkerPoolFromFilter: () => {},
  clearAllFilters: () => {},
}

export const ActiveFitlersCtx = createContext<ActiveFilters>(initialState)
