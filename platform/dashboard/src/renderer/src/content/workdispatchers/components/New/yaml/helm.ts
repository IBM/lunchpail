import { load } from "js-yaml"

import type Values from "../Values"

export default function helmYaml({ repo, values }: Values["values"]) {
  const lines = [`repo: ${repo}`]

  if (values) {
    try {
      lines.push(`values: >
  ${JSON.stringify(load(values))}`)
    } catch (err) {
      console.error("Invalid yaml", values)
    }
  }

  return lines.join("\n")
}
