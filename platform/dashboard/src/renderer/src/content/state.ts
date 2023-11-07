import queueState from "./queues/state"
import datasetsState from "./datasets/state"
import taskqueuesState from "./taskqueues/state"
import workerpoolsState from "./workerpools/state"
import applicationsState from "./applications/state"
import tasksimulatorState from "./tasksimulators/state"
import platformreposecretState from "./platformreposecrets/state"

import type WatchedKind from "@jay/common/Kind"
import type ManagedEvents from "./ManagedEvent"
import type { ManagedEvent } from "./ManagedEvent"
import type { EventLike } from "@jay/common/events/EventSourceLike"

import { returnHomeCallback } from "../navigate/home"

type EventHandler = (evt: EventLike) => void

export type StateForKind<Kind extends WatchedKind> = readonly [ManagedEvent<Kind>[], EventHandler]

type ManagedState = {
  [Kind in WatchedKind]: StateForKind<Kind>
}

type ManagedHandlers = {
  [Kind in WatchedKind]: EventHandler
}

export default function initStreamingState(): { events: ManagedEvents; handlers: ManagedHandlers } {
  const returnHome = returnHomeCallback()

  // Below, for the convenience of callers, we parcel out ManagedState
  // into the events (state.kind[0]) and handlers (state.kind[1])
  const state: ManagedState = {
    // future readers: if you want to wire the UI up to backend
    // resource trackers, add your state here
    queues: queueState(),
    datasets: datasetsState(returnHome),
    taskqueues: taskqueuesState(),
    workerpools: workerpoolsState(returnHome),
    applications: applicationsState(returnHome),
    tasksimulators: tasksimulatorState(returnHome),
    platformreposecrets: platformreposecretState(returnHome),
  }

  // just for convenience
  const events: ManagedEvents = Object.entries(state).reduce((M, [kind, state]) => {
    M[kind] = state[0]
    return M
  }, {} as ManagedEvents)

  // just for convenience
  const handlers: ManagedHandlers = Object.entries(state).reduce((M, [kind, state]) => {
    M[kind] = state[1]
    return M
  }, {} as ManagedHandlers)

  return { events, handlers }
}
