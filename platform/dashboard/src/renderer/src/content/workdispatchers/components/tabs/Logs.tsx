import Logs from "@jaas/components/Logs"
import DrawerTab from "@jaas/components/Drawer/Tab"

export function LogsTab(props: { selector: string; namespace: string }) {
  return DrawerTab({
    title: "Logs",
    hasNoPadding: true,
    body: <Logs follow selector={props.selector} namespace={props.namespace} />,
  })
}

/** Logs tab for WorkDispatcher Detail */
export default function WorkDispatcherLogsTab(name: string, namespace: string) {
  return LogsTab({
    namespace,
    selector: `app.kubernetes.io/component=workdispatcher,app.kubernetes.io/name=${name}`,
  })
}
