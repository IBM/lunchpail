import { useState } from "react"
import type QueueEvent from "@jaas/common/events/QueueEvent"

import { allTimestampedEventsHandler } from "../events/all"

export default function init() {
  const [events, setEvents] = useState<QueueEvent[]>([])

  return [events, allTimestampedEventsHandler(setEvents)] as const
}
