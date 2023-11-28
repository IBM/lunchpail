import Logs from "@jay/components/Logs"
import DrawerTab from "@jay/components/Drawer/Tab"

import type Props from "../Props"

export function LogsTab(props: { selector: string; namespace: string }) {
  return DrawerTab({
    title: "Logs",
    hasNoPadding: true,
    body: <Logs follow selector={props.selector} namespace={props.namespace} />,
  })
}

/** Logs tab for WorkDispatcher Detail */
export default function WorkDispatcherLogsTab(props: Props) {
  return LogsTab({
    selector: `app.kubernetes.io/component=workdispatcher,app.kubernetes.io/name=${props.workdispatcher.metadata.name}`,
    namespace: props.workdispatcher.metadata.namespace,
  })
}
