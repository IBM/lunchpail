import type { MouseEvent } from "react"
import { Button, Text, Tooltip } from "@patternfly/react-core"

import { singular } from "../../names"

import Icon from "@patternfly/react-icons/dist/esm/icons/parachute-box-icon"

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
    frequencyInSeconds: 5
`
  // ^^^ 1 every 5 seconds
}

function onClick(evt: MouseEvent) {
  const name = evt.currentTarget.getAttribute("data-name")
  const namespace = evt.currentTarget.getAttribute("data-namespace")

  if (name && namespace) {
    window.jay.create({ name, namespace }, yaml(name, namespace))
  }
}

export default function TaskSimulatorButton(props: { name: string; namespace: string }) {
  return (
    <Tooltip content={<Text component="p">Launch a task simulator against this {singular.datasets}</Text>}>
      <Button size="lg" variant="plain" data-name={props.name} data-namespace={props.namespace} onClick={onClick}>
        <Icon className="codeflare--status-online" />
      </Button>
    </Tooltip>
  )
}
