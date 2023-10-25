import { useCallback } from "react"

import type { Dispatch, SetStateAction } from "react"
import type { EventLike } from "@jay/common/events/EventSourceLike"

/** Remember all events in state */
export default function allEventsHandler<T extends { timestamp: number }>(setState: Dispatch<SetStateAction<T[]>>) {
  return useCallback((evt: EventLike) => {
    const event = JSON.parse(evt.data) as T
    setState((A) => [...A, event])
  }, [])
}
