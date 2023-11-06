import { useState } from "react"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

export default function init() {
  return useState<ApplicationSpecEvent[]>([])
}
