import { useCallback } from "react"

import { isDetailableKind } from "../Kind"
import { closeDetailViewIfShowing } from "../pages/PageWithDrawer"

import type Kind from "../Kind"
import type { Dispatch, SetStateAction } from "react"
import type { EventLike } from "@jay/common/events/EventSourceLike"
import type KubernetesResource from "@jay/common/events/KubernetesResource"

/** Remember just the last event for each resource instance in state */
export default function singletonJsonEventHandler<T extends KubernetesResource>(
  kind: Kind,
  setState: Dispatch<SetStateAction<T[]>>,
  returnHome: () => void,
  watchTheseValues = [],
) {
  return useCallback(
    (evt: EventLike) => {
      const events = JSON.parse(evt.data) as T[]

      for (const event of events) {
        const name = event.metadata.name
        const status = event.metadata.annotations["codeflare.dev/status"]

        if (status === "Terminating") {
          if (isDetailableKind(kind)) {
            closeDetailViewIfShowing(name, kind, returnHome)
          }

          setState((A) => A.filter((_) => _.metadata.name !== name))
        } else {
          setState((A) => {
            const idx = A.findIndex((_) => _.metadata.name === name)
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
