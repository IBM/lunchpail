import { useCallback } from "react"

import { isNavigableKind } from "../Kind"
import { closeDetailViewIfShowing } from "../pages/PageWithDrawer"

import type Kind from "../Kind"
import type { Dispatch, SetStateAction } from "react"
import type { EventLike } from "@jay/common/events/EventSourceLike"

/** Remember just the last event for each resource instance in state */
export default function singletonEventHandler<
  NameField extends string,
  T extends Record<NameField, string> & { status: string },
>(
  nameField: NameField,
  kind: Kind,
  setState: Dispatch<SetStateAction<T[]>>,
  returnHome: () => void,
  watchTheseValues = [],
) {
  return useCallback((evt: EventLike) => {
    const event = JSON.parse(evt.data) as T
    const name = event[nameField]

    if (event.status === "Terminating") {
      if (isNavigableKind(kind)) {
        closeDetailViewIfShowing(name, kind, returnHome)
      }

      setState((A) => A.filter((_) => _[nameField] !== name))
    } else {
      setState((A) => {
        const idx = A.findIndex((_) => _[nameField] === name)
        if (idx >= 0) {
          return [...A.slice(0, idx), event, ...A.slice(idx + 1)]
        } else {
          return [...A, event]
        }
      })
    }
  }, watchTheseValues)
}
