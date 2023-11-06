import { useState } from "react"
import type PlatformRepoSecretEvent from "@jay/common/events/PlatformRepoSecretEvent"

export default function init() {
  return useState<PlatformRepoSecretEvent[]>([])
}
