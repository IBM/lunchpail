import type { Values } from "../Wizard"

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

export default function taskSimulatorYaml({ tasks, intervalSeconds, inputFormat, inputSchema }: Values["values"]) {
  let yaml = `
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
  format: ${inputFormat.toLowerCase()}
  columns: ${JSON.stringify(columns)}
  columnTypes: ${JSON.stringify(columnTypes)}
`
  }

  return yaml
}
