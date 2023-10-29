import { createContext } from "react"

export type ActiveFilters = {
  applications: string[]
  taskqueues: string[]
  workerpools: string[]
  showingAllApplications: boolean
  showingAllTaskQueues: boolean
  showingAllWorkerPools: boolean

  addApplicationToFilter: (arg: string) => void
  addTaskQueueToFilter: (arg: string) => void
  addWorkerPoolToFilter: (arg: string) => void

  removeApplicationFromFilter: (arg: string) => void
  removeTaskQueueFromFilter: (arg: string) => void
  removeWorkerPoolFromFilter: (arg: string) => void

  toggleShowAllApplications(): void
  toggleShowAllTaskQueues(): void
  toggleShowAllWorkerPools(): void

  clearAllFilters: () => void
}

export const initialState: ActiveFilters = {
  applications: [],
  taskqueues: [],
  workerpools: [],

  showingAllApplications: false,
  showingAllTaskQueues: false,
  showingAllWorkerPools: false,

  addApplicationToFilter: () => {},
  addTaskQueueToFilter: () => {},
  addWorkerPoolToFilter: () => {},

  removeApplicationFromFilter: () => {},
  removeTaskQueueFromFilter: () => {},
  removeWorkerPoolFromFilter: () => {},

  toggleShowAllApplications() {},
  toggleShowAllTaskQueues() {},
  toggleShowAllWorkerPools() {},

  clearAllFilters: () => {},
}

export const ActiveFitlersCtx = createContext<ActiveFilters>(initialState)
