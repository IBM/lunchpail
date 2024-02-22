import type Props from "../Props"

import { LogsTab } from "@jaas/resources/workdispatchers/components/tabs/Logs"
import { singular as Run } from "@jaas/resources/runs/name"

/** Logs tab for WorkStealer */
export default function WorkStealerLogsTab(props: Props) {
  return LogsTab({
    selector: [
      `app.kubernetes.io/component=workstealer,app.kubernetes.io/part-of=${props.run.metadata.name}`,
      // `app.kubernetes.io/component=workstealer,app.kubernetes.io/name=${props.model.application}`,
    ].join(":"),
    tooltip: `Logs for the WorkStealer associated with this ${Run}`,
    context: props.run.metadata.context,
    namespace: props.run.metadata.namespace,
  })
}
