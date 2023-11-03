import { useCallback } from "react"

import type { Dispatch, SetStateAction } from "react"
import type { EventLike } from "@jay/common/events/EventSourceLike"
import type WithTimestamp from "@jay/common/events/WithTimestamp"
import type KubernetesResource from "@jay/common/events/KubernetesResource"

function status({ metadata }: KubernetesResource<unknown>) {
  return metadata.annotations["codeflare.dev/status"]
}

function same(a: KubernetesResource<unknown>, b: KubernetesResource<unknown>) {
  return (
    a.apiVersion === b.apiVersion &&
    a.kind === b.kind &&
    a.metadata.name === b.metadata.name &&
    a.metadata.namespace === b.metadata.namespace
  )
}

/** Remember all events in state */
export function allEventsHandler<R extends KubernetesResource<unknown>>(setState: Dispatch<SetStateAction<R[]>>) {
  return useCallback(
    (evt: EventLike) => {
      const events = JSON.parse(evt.data) as R[]

      const deleteEvents = events.filter((_) => status(_) === "Terminating")
      const normalEvents = events.filter((_) => status(_) !== "Terminating")

      setState((A) => [...A.filter((old) => !deleteEvents.find((deleted) => same(old, deleted))), ...normalEvents])
    },
    [setState],
  )
}

/** Remember all timestamped events in state */
export function allTimestampedEventsHandler<R extends WithTimestamp<KubernetesResource<unknown>>>(
  setState: Dispatch<SetStateAction<R[]>>,
) {
  return useCallback(
    (evt: EventLike) => {
      const events = JSON.parse(evt.data) as R[]

      const deleteEvents = events.filter((_) => status(_.event) === "Terminating")
      const normalEvents = events.filter((_) => status(_.event) !== "Terminating")

      setState((A) => [
        ...A.filter((old) => !deleteEvents.find((deleted) => same(old.event, deleted.event))),
        ...normalEvents,
      ])
    },
    [setState],
  )
}
