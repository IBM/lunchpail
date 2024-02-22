import Logs from "@jaas/components/Logs"
import DrawerTab from "@jaas/components/Drawer/Tab"

export function LogsTab(props: { selector: string; namespace: string; context: string; tooltip?: string }) {
  return DrawerTab({
    title: "Logs",
    hasNoPadding: true,
    tooltip: props.tooltip,
    body: <Logs follow selector={props.selector} namespace={props.namespace} context={props.context} />,
  })
}

/** Logs tab for WorkDispatcher Detail */
export default function WorkDispatcherLogsTab(name: string, namespace: string, context: string) {
  return LogsTab({
    context,
    namespace,
    selector: `app.kubernetes.io/component=workdispatcher,app.kubernetes.io/name=${name}`,
  })
}
