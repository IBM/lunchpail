import type ManagedEvents from "./ManagedEvent"
import type WatchedKind from "@jay/common/Kind"
import initStreamingState, { type EventHandler } from "./state"

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
