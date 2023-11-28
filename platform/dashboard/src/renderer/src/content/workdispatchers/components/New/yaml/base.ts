import type Method from "../Method"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

/** Yaml common to all work dispatch methods */
export default function baseYaml(
  name: string,
  namespace: string,
  application: ApplicationSpecEvent,
  taskqueue: string,
  method: Method,
) {
  return `
apiVersion: codeflare.dev/v1alpha1
kind: WorkDispatcher
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: workdispatcher
    app.kubernetes.io/managed-by: jay
    app.kubernetes.io/name: ${application.metadata.name}
spec:
  method: ${method}
  application: ${application.metadata.name}
  dataset: ${taskqueue}
`
}
