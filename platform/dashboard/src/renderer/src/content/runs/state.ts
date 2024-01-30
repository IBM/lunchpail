import { useState } from "react"
import type RunEvent from "@jaas/common/events/RunEvent"

import singletonEventHandler from "../events/singleton"

export default function init(returnHome: () => void) {
  const [events, setEvents] = useState<RunEvent[]>([])
  return [events, singletonEventHandler("runs", setEvents, returnHome)] as const
}
