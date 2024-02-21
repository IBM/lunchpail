import RunDetail from "./components/Detail"

import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
import type { CurrentSettings } from "@jaas/renderer/Settings"

export default function Detail(
  id: string,
  context: string,
  events: ManagedEvents,
  memos: Memos,
  settings: CurrentSettings,
) {
  const run = events.runs.find((_) => _.metadata.name === id && _.metadata.context === context)
  if (run) {
    const application = events.applications.find((_) => _.metadata.name === id && _.metadata.context === context)
    const props = {
      run,
      context,
      settings,
      application,
      datasets: events.datasets,
      taskqueues: events.taskqueues,
      workdispatchers: events.workdispatchers,
      workerpools: events.workerpools,
      latestWorkerPoolModels: memos.latestWorkerPoolModels,
    }
    return { body: <RunDetail {...props} />, subtitle: application?.spec.description }
  } else {
    return undefined
  }
}
