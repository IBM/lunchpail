import type Props from "../Props"

import { LogsTab } from "@jaas/resources/workdispatchers/components/tabs/Logs"

/** Logs tab for WorkerPool Detail */
export default function WorkerPoolLogsTab(props: Props) {
  return LogsTab({
    selector: [
      `app.kubernetes.io/component=workerpool,app.kubernetes.io/name=${props.model.label}`,
      // `app.kubernetes.io/component=workstealer,app.kubernetes.io/name=${props.model.application}`,
    ].join(":"),
    context: props.model.context,
    namespace: props.model.namespace,
  })
}
