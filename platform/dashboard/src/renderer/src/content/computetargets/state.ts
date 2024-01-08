import { useState } from "react"
import type ComputeTargetEvent from "@jay/common/events/ComputeTargetEvent"

import singletonEventHandler from "../events/singleton"

export default function init(returnHome: () => void) {
  const [events, setEvents] = useState<ComputeTargetEvent[]>([])
  return [events, singletonEventHandler("computetargets", setEvents, returnHome)] as const
}
