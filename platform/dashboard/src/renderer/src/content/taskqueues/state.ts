import { useState } from "react"
import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"

import { allEventsHandler } from "../events/all"

export default function init() {
  const [events, setEvents] = useState<TaskQueueEvent[]>([])

  return [events, allEventsHandler(setEvents)] as const
}
