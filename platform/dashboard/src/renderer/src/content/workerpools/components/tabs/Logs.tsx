import type NameProps from "@jaas/components/NameProps"
import { LogsTab } from "@jaas/resources/workdispatchers/components/tabs/Logs"

/** Logs tab for WorkerPool Detail */
export default function WorkerPoolLogsTab({ name, namespace, context }: NameProps) {
  return LogsTab({
    selector: `app.kubernetes.io/component=workerpool,app.kubernetes.io/name=${name}`,
    context,
    namespace,
  })
}
