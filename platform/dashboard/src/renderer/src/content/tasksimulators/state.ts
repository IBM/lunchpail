import { useState } from "react"
import type TaskSimulatorEvent from "@jay/common/events/TaskSimulatorEvent"

export default function init() {
  return useState<TaskSimulatorEvent[]>([])
}
