import { useState } from "react"
import type WorkerPoolStatusEvent from "@jay/common/events/WorkerPoolStatusEvent"

export default function init() {
  return useState<WorkerPoolStatusEvent[]>([])
}
