import type Values from "../Values"

export default function helmYaml({ repo }: Values["values"]) {
  return `
repo: ${repo}
`.trim()
}
