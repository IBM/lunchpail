import { load } from "js-yaml"

import type Values from "../Values"
import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"

function safeLoad(yaml: string): Record<string, unknown> {
  try {
    return load(yaml) as Record<string, unknown>
  } catch (err) {
    // TODO report this to the user
    console.error("Invalid yaml", yaml)
    return {}
  }
}

export default function helmYaml({ repo, values }: Values["values"], application: ApplicationSpecEvent) {
  const lines = [`repo: ${repo}`]

  const valuesObj = safeLoad(values)

  if (valuesObj) {
    // add the application name to the values.yaml
    if ("application" in valuesObj) {
      valuesObj.application = application.metadata.name
    }

    lines.push(`values: >
  ${JSON.stringify(valuesObj)}`)
  }

  return lines.join("\n")
}
