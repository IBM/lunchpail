import type Props from "../Props"

import { LogsTab } from "@jay/resources/workdispatchers/components/tabs/Logs"

/** Logs tab for WorkerPool Detail */
export default function WorkerPoolLogsTab(props: Props) {
  return LogsTab({
    selector: `app.kubernetes.io/component=workerpool,app.kubernetes.io/name=${props.model.label}`,
    namespace: props.model.namespace,
  })
}
