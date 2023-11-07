import { useState } from "react"
import type TaskSimulatorEvent from "@jay/common/events/TaskSimulatorEvent"

import singletonEventHandler from "../events/singleton"

export default function init(returnHome: () => void) {
  const [events, setEvents] = useState<TaskSimulatorEvent[]>([])
  return [events, singletonEventHandler("tasksimulators", setEvents, returnHome)] as const
}
