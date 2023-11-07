import { useState } from "react"
import type DataSetEvent from "@jay/common/events/DataSetEvent"

import singletonEventHandler from "../../events/singleton"

export default function init(returnHome: () => void) {
  const [events, setEvents] = useState<DataSetEvent[]>([])
  return [events, singletonEventHandler("datasets", setEvents, returnHome)] as const
}
