import type Method from "../Method"
import type RunEvent from "@jaas/common/events/RunEvent"

/** Yaml common to all work dispatch methods */
export default function baseYaml(name: string, namespace: string, run: RunEvent, method: Method) {
  return `apiVersion: codeflare.dev/v1alpha1
kind: WorkDispatcher
metadata:
  name: ${name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: workdispatcher
    app.kubernetes.io/managed-by: jaas
    app.kubernetes.io/name: ${run.metadata.name}
spec:
  method: ${method}
  run: ${run.metadata.name}
`
}
