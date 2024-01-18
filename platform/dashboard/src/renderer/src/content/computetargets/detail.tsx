// import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
// import type { CurrentSettings } from "@jay/renderer/Settings"

import Detail from "./components/Detail"

export default function ComputeTargetDetail(
  id: string,
  context: string,
  events: ManagedEvents /* , memos: Memos, settings: CurrentSettings */,
) {
  const event = events.computetargets.find((_) => _.metadata.name === id && _.metadata.context === context)
  return !event ? undefined : { body: <Detail {...event} /> }
}
