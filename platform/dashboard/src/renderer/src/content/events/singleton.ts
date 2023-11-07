import { useCallback } from "react"

import { isDetailableKind } from "../DetailableKind"
import { closeDetailViewIfShowing } from "../../pages/PageWithDrawer"

import type WatchedKind from "@jay/common/Kind"
import type { ManagedEvent } from "../ManagedEvent"
import type { Dispatch, SetStateAction } from "react"
import type { EventLike } from "@jay/common/events/EventSourceLike"

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
        const namespace = event.metadata.namespace
        const status = event.metadata.annotations["codeflare.dev/status"]

        if (status === "Terminating") {
          if (isDetailableKind(kind)) {
            closeDetailViewIfShowing(name, kind, returnHome)
          }

          setState((A) => A.filter((_) => _.metadata.name !== name || _.metadata.namespace !== namespace))
        } else {
          setState((A) => {
            const idx = A.findIndex((_) => _.metadata.name === name && _.metadata.namespace === namespace)
            if (idx >= 0) {
              return [...A.slice(0, idx), event, ...A.slice(idx + 1)]
            } else {
              return [...A, event]
            }
          })
        }
      }
    },
    [...watchTheseValues, setState, returnHome, kind],
  )
}
