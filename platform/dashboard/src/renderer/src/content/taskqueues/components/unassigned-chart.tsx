import type Props from "./Props"

import Sparkline from "@jaas/components/Sparkline"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

import { nUnassigned } from "./unassigned"

function inboxHistory(props: Props) {
  return props.events.map((taskqueue) => nUnassigned({ taskqueue, run: props.run }))
}

export default function unassignedChart(props: Props) {
  const history = inboxHistory(props)

  return history.length <= 1
    ? []
    : [
        descriptionGroup(
          "Unassigned Tasks over Time",
          history.length === 0 ? <></> : <Sparkline data={history} type="bars" />,
        ),
      ]
}
