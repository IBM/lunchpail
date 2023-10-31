import type { MouseEvent } from "react"
import { Button, Text, Tooltip } from "@patternfly/react-core"

import { singular } from "../../names"

import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"
import type TaskSimulatorEvent from "@jay/common/events/TaskSimulatorEvent"

import OnIcon from "@patternfly/react-icons/dist/esm/icons/sun-icon"
import OffIcon from "@patternfly/react-icons/dist/esm/icons/outlined-sun-icon"

type Props = {
  event: TaskQueueEvent
  simulators: TaskSimulatorEvent[]
  invisibleIfNoSimulators?: boolean
}

function yaml(name: string, namespace: string) {
  return `
apiVersion: codeflare.dev/v1alpha1
kind: TaskSimulator
metadata:
  name: ${name}
  namespace: ${namespace}
spec:
  dataset: ${name}
  rate:
    tasks: 1
    intervalSeconds: 5
`
  // ^^^ 1 every 5 seconds
}

function onClick(evt: MouseEvent) {
  const name = evt.currentTarget.getAttribute("data-name")
  const namespace = evt.currentTarget.getAttribute("data-namespace")
  const action = evt.currentTarget.getAttribute("data-action") as "delete" | "create"

  if (name && namespace) {
    if (action === "create") {
      window.jay.create({ name, namespace }, yaml(name, namespace))
    } else {
      window.jay.delete({ kind: "tasksimulators.codeflare.dev", name, namespace })
    }
  }
}

export default function TaskSimulatorButton(props: Props) {
  const nSimulators = props.simulators.length
  const online = nSimulators > 0
  const message = online
    ? `This ${singular.taskqueues} has ${nSimulators} assigned ${
        nSimulators === 1 ? "task simulator" : "task simualtors"
      }. Click here to stop ${nSimulators === 1 ? "it" : "them"}.`
    : "Launch a task simulator"

  if (!online && props.invisibleIfNoSimulators) {
    return <></>
  }

  return (
    <Tooltip content={<Text component="p">{message}</Text>}>
      <Button
        size="lg"
        variant="plain"
        data-name={props.event.metadata.name}
        data-namespace={props.event.metadata.namespace}
        data-action={online ? "delete" : "create"}
        onClick={onClick}
      >
        {online ? <OnIcon className="codeflare--status-active" /> : <OffIcon />}
      </Button>
    </Tooltip>
  )
}
