import { useState } from "react"
import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"

export default function init() {
  return useState<TaskQueueEvent[]>([])
}
