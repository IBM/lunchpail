import runState from "./runs/state"
import queueState from "./queues/state"
import datasetsState from "./datasets/state"
import taskqueuesState from "./taskqueues/state"
import workerpoolsState from "./workerpools/state"
import applicationsState from "./applications/state"
import computetargetsState from "./computetargets/state"
import workdispatcherState from "./workdispatchers/state"
import platformreposecretState from "./platformreposecrets/state"

import type WatchedKind from "@jaas/common/Kind"
import type { ManagedEvent } from "./ManagedEvent"
import type { EventLike } from "@jaas/common/events/EventSourceLike"

import { returnHomeCallback } from "../navigate/home"

/**
 * This is the callback that should be invoked when data arrives.
 */
export type EventHandler = (evt: EventLike) => void

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
export default function initStreamingState(): ManagedState {
  const returnHome = returnHomeCallback()

  return {
    // future readers: if you want to wire the UI up to backend
    // resource trackers, add your state here
    runs: runState(returnHome),
    queues: queueState(),
    datasets: datasetsState(returnHome),
    taskqueues: taskqueuesState(),
    workerpools: workerpoolsState(returnHome),
    applications: applicationsState(returnHome),
    computetargets: computetargetsState(returnHome),
    workdispatchers: workdispatcherState(returnHome),
    platformreposecrets: platformreposecretState(returnHome),
  }
}
