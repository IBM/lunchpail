// import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
// import type { CurrentSettings } from "@jaas/renderer/Settings"

import Detail from "./components/Detail"

export default function ComputeTargetDetail(
  id: string,
  _context: string,
  events: ManagedEvents /* , memos: Memos, settings: CurrentSettings */,
) {
  const event = events.computetargets.find((_) => _.metadata.context === id)
  return !event ? undefined : { body: <Detail {...event} /> }
}
