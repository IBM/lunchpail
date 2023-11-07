import { useState } from "react"
import type WorkerPoolStatusEvent from "@jay/common/events/WorkerPoolStatusEvent"

import singletonEventHandler from "../events/singleton"

export default function init(returnHome: () => void) {
  const [events, setEvents] = useState<WorkerPoolStatusEvent[]>([])
  return [events, singletonEventHandler("datasets", setEvents, returnHome)] as const
}
