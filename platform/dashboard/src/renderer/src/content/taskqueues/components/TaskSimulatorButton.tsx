import { useCallback, type MouseEvent } from "react"
import { Button, Text, Tooltip } from "@patternfly/react-core"

import { singular } from "../name"
import { associatedApplications } from "./common"

import type TaskQueueProps from "./Props"
import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"

import OnIcon from "@patternfly/react-icons/dist/esm/icons/sun-icon"
import OffIcon from "@patternfly/react-icons/dist/esm/icons/outlined-sun-icon"

type Props = Pick<TaskQueueProps, "name" | "applications" | "tasksimulators"> & {
  event: TaskQueueEvent
  invisibleIfNoSimulators?: boolean
}

type TypeSpec = string | (string | TypeSpec)[]

function typeOfScalar(spec: string) {
  if (spec === "null" || spec === "string") {
    return spec
  } else if (spec === "int" || spec === "long") {
    return "number"
  } else {
    console.error("Unknown schema type", spec)
    return "null"
  }
}

function typeOf(spec: TypeSpec) {
  if (typeof spec === "string") {
    return typeOfScalar(spec)
  } else {
    const nonNull = spec.filter((_) => _ !== "null" && typeof _ === "string") as string[]
    if (nonNull.length === 0) {
      // weird
      return "null"
    } else {
      return typeOfScalar(nonNull[0])
    }
  }
}

function yaml(name: string, namespace: string, applications: Props["applications"]) {
  let yaml = `
apiVersion: codeflare.dev/v1alpha1
kind: TaskSimulator
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/managed-by: jay
    app.kubernetes.io/component: tasksimulator
spec:
  dataset: ${name}
  rate:
    tasks: 1
    intervalSeconds: 5
`
  // ^^^ 1 every 5 seconds

  const firstApp = applications.length === 0 ? undefined : applications[0]
  const inputs = !firstApp ? undefined : firstApp.spec.inputs
  const schema = !inputs || inputs.length === 0 ? undefined : inputs[0].schema

  if (schema) {
    // TODO: finish up schema.fields, populating it from the `schema` variable
    const json = JSON.parse(schema.json)
    const columns = json.fields.map((_) => _.name)
    const columnTypes = json.fields.map((_) => _.type).map(typeOf)

    yaml += `
  schema:
    format: ${schema.format}
    columns: ${JSON.stringify(columns)}
    columnTypes: ${JSON.stringify(columnTypes)}
`
  }

  return yaml
}

export default function TaskSimulatorButton(props: Props) {
  const nSimulators = props.tasksimulators.length
  const online = nSimulators > 0
  const message = online
    ? `This ${singular} has ${nSimulators} assigned ${
        nSimulators === 1 ? "task simulator" : "task simualtors"
      }. Click here to stop ${nSimulators === 1 ? "it" : "them"}.`
    : "Launch a task simulator"

  if (!online && props.invisibleIfNoSimulators) {
    return <></>
  }

  /** Button onclick handler */
  const onClick = useCallback(
    (evt: MouseEvent) => {
      evt.stopPropagation()

      const { name, namespace } = props.event.metadata
      const action = online ? "delete" : "create"

      if (name && namespace) {
        const applications = associatedApplications(props)
        const yamlString = yaml(name, namespace, applications)

        if (action === "create") {
          window.jay.create({ name, namespace }, yamlString)
        } else {
          window.jay.delete(yamlString)
        }
      }
    },
    [props.event, props.applications, online, window.jay.create, window.jay.delete],
  )

  return (
    <Tooltip content={<Text component="p">{message}</Text>}>
      <Button size="lg" variant="plain" onClick={onClick}>
        {online ? <OnIcon className="codeflare--status-active" /> : <OffIcon />}
      </Button>
    </Tooltip>
  )
}
