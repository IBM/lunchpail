import { Badge, TabAction } from "@patternfly/react-core"

import taskqueueProps from "../taskqueueProps"

import StatusBody from "./StatusBody"
import DrawerTab from "@jay/components/Drawer/Tab"

import type Props from "../Props"

/** Tab that shows Status of tasks and compute */
export default function statusTab(props: Props) {
  const queueProps = taskqueueProps(props)
  if (!queueProps) {
    return
  }

  // any associated workerpools?
  const models = props.latestWorkerPoolModels.filter((_) => _.application === props.application.metadata.name)
  const nWorkers = models.reduce((N, model) => N + model.inbox.length, 0)

  return DrawerTab({
    title: "Status",
    body: <StatusBody props={props} queueProps={queueProps} models={models} />,
    hasNoPadding: true,
    actions: (
      <TabAction>
        <Badge isRead={models.length === 0}>{pluralize("worker", nWorkers)}</Badge>
      </TabAction>
    ),
  })
}

function pluralize(text: string, value: number) {
  return `${value} ${text}${value !== 1 ? "s" : ""}`
}
