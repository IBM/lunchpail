import { useState } from "react"
import type DataSetEvent from "@jay/common/events/DataSetEvent"

export default function init() {
  return useState<DataSetEvent[]>([])
}
