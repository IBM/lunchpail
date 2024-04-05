import { useCallback } from "react"

import { isDetailableKind } from "../DetailableKind"
import closeDetailViewIfShowing from "../../pages/close-detail"

import type WatchedKind from "@jaas/common/Kind"
import type { ManagedEvent } from "../ManagedEvent"
import type { Dispatch, SetStateAction } from "react"
import type { EventLike } from "@jaas/common/events/EventSourceLike"

/** Remember just the last event for each resource instance in state */
export default function singletonJsonEventHandler<Kind extends WatchedKind, Event extends ManagedEvent<Kind>>(
  kind: Kind,
  setState: Dispatch<SetStateAction<Event[]>>,
  returnHome: () => void,
  watchTheseValues: unknown[] = [],
) {
  return useCallback(
    (evt: EventLike) => {
      const events = JSON.parse(evt.data) as Event[]

      for (const event of events) {
        const name = event.metadata.name
        const context = event.metadata.context
        const namespace = event.metadata.namespace
        const status = event.metadata.annotations["lunchpail.io/status"]

        setState((A) => {
          const idx = A.findIndex(
            (_) => _.metadata.name === name && _.metadata.namespace === namespace && _.metadata.context === context,
          )

          if (status === "Terminating") {
            if (isDetailableKind(kind)) {
              closeDetailViewIfShowing(name, context, kind, returnHome)
            }
            if (idx >= 0) {
              A.splice(idx, 1)
            }
            return A
          } else if (idx >= 0) {
            return [...A.slice(0, idx), event, ...A.slice(idx + 1)]
          } else {
            return [...A, event]
          }
        })
      }
    },
    [...watchTheseValues, setState, returnHome, kind],
  )
}
