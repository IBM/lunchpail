import { useState } from "react"
import type PlatformRepoSecretEvent from "@jay/common/events/PlatformRepoSecretEvent"

import singletonEventHandler from "../../events/singleton"

export default function init(returnHome: () => void) {
  const [events, setEvents] = useState<PlatformRepoSecretEvent[]>([])
  return [events, singletonEventHandler("datasets", setEvents, returnHome)] as const
}
