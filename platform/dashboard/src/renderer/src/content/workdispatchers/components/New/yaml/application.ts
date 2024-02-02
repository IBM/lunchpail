import type Values from "../Values"

export default function applicationYaml({ application, namespace }: Values["values"]) {
  return `
application:
  name: ${application}
  namespace: ${namespace}
`.trim()
}
