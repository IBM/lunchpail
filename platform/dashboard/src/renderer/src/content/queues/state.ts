import { useState } from "react"
import type QueueEvent from "@jay/common/events/QueueEvent"

export default function init() {
  return useState<QueueEvent[]>([])
}
