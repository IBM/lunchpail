import { useState } from "react"
import type WorkDispatcherEvent from "@jaas/common/events/WorkDispatcherEvent"

import singletonEventHandler from "../events/singleton"

export default function init(returnHome: () => void) {
  const [events, setEvents] = useState<WorkDispatcherEvent[]>([])
  return [events, singletonEventHandler("workdispatchers", setEvents, returnHome)] as const
}
