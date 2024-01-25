import type Props from "./Props"

import Sparkline from "@jaas/components/Sparkline"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

function inboxHistory(props: Props) {
  return props.events.map((_) =>
    !_.metadata.annotations["codeflare.dev/unassigned"]
      ? 0
      : parseInt(_.metadata.annotations["codeflare.dev/unassigned"], 10),
  )
}

export default function unassignedChart(props: Props) {
  const history = inboxHistory(props)

  return history.length <= 1
    ? []
    : [
        descriptionGroup(
          "Unassigned Tasks over Time",
          history.length === 0 ? <></> : <Sparkline data={history} taskqueueIdx={props.idx} type="bars" />,
        ),
      ]
}
