import ApplicationDetail from "./components/Detail"

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
  const application = events.applications.find((_) => _.metadata.name === id && _.metadata.context === context)
  if (application) {
    const props = {
      context,
      settings,
      application,
      datasets: events.datasets,
      taskqueues: events.taskqueues,
      workdispatchers: events.workdispatchers,
      workerpools: events.workerpools,
      latestWorkerPoolModels: memos.latestWorkerPoolModels,
    }
    return { body: <ApplicationDetail {...props} />, subtitle: props.application.spec.description }
  } else {
    return undefined
  }
}
