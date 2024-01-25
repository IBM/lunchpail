import { useState } from "react"
import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"

import singletonEventHandler from "../events/singleton"

export default function init(returnHome: () => void) {
  const [events, setEvents] = useState<ApplicationSpecEvent[]>([])
  return [events, singletonEventHandler("applications", setEvents, returnHome)] as const
}
