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

/**
 * This is the callback that should be invoked when data arrives.
 */
type EventHandler = (evt: EventLike) => void

/**
 * This just says that `ManagedState` has a pair (array of events, handler)
 * for each `Kind`. The UI can then display the array of events, and it is
 * the job of the UI (currently `Dashboard.tsx`) to wire the `EventHandler`
 * up to the streams.
 */
type ManagedState = {
  [Kind in WatchedKind]: readonly [ManagedEvent<Kind>[], EventHandler]
}

/**
 * Initialize React state that hooks up with tracking processes. These
 * will feed into React state models, as governed by the individual
 * state handlers, e.g. `applicationsState()`
 */
export function initStreamingState(): ManagedState {
  const returnHome = returnHomeCallback()

  return {
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
}

/**
 * This just says that `ManagedHandlers` has one `EventHandler` per
 * `Kind`.
 */
type ManagedHandlers = {
  [Kind in WatchedKind]: EventHandler
}

/**
 * For the convenience of callers, we parcel out `ManagedState` into
 * the `events` (state[*].kind[0]) and `handlers` (state[*].kind[1])
 */
export default function initEventsAndHandlers(): { events: ManagedEvents; handlers: ManagedHandlers } {
  const state = initStreamingState()

  // nothing deep here, just for convenience
  const events: ManagedEvents = Object.entries(state).reduce((M, [kind, state]) => {
    M[kind] = state[0]
    return M
  }, {} as ManagedEvents)

  // nothing deep here, just for convenience
  const handlers: ManagedHandlers = Object.entries(state).reduce((M, [kind, state]) => {
    M[kind] = state[1]
    return M
  }, {} as ManagedHandlers)

  return { events, handlers }
}
