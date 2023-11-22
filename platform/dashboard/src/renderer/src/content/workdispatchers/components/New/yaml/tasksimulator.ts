import type { Values } from "../Wizard"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

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

export default function taskSimulatorYaml(
  { name, namespace, tasks, intervalSeconds, inputFormat, inputSchema }: Values["values"],
  application: ApplicationSpecEvent,
  taskqueue: string,
) {
  let yaml = `
apiVersion: codeflare.dev/v1alpha1
kind: WorkDispatcher
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: tasksimulator
    app.kubernetes.io/managed-by: jay
spec:
  method: tasksimulator
  application: ${application.metadata.name}
  dataset: ${taskqueue}
  rate:
    tasks: ${tasks}
    intervalSeconds: ${intervalSeconds}
`.trim()

  if (inputFormat && inputSchema) {
    // TODO: finish up schema.fields, populating it from the `schema` variable
    const json = JSON.parse(inputSchema)
    const columns = json.fields.map((_) => _.name)
    const columnTypes = json.fields.map((_) => _.type).map(typeOf)

    yaml += `
  schema:
    format: ${inputFormat}
    columns: ${JSON.stringify(columns)}
    columnTypes: ${JSON.stringify(columnTypes)}
`
  }

  return yaml
}
