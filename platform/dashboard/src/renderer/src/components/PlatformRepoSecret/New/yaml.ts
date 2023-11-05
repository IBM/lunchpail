import Props from "../Props"

export type YamlProps = Pick<Props["metadata"], "name" | "namespace"> &
  Pick<Props["spec"], "repo"> & {
    user: string
    pat: string
  }

export default function yaml(values: YamlProps) {
  return `
apiVersion: codeflare.dev/v1alpha1
kind: PlatformRepoSecret
metadata:
  name: ${values.name}
  labels:
    app.kubernetes.io/managed-by: jay
spec:
  repo: ${values.repo}
  secret:
    name: ${values.name}
    namespace: ${values.namespace}
---
apiVersion: v1
kind: Secret
metadata:
  name: ${values.name}
  namespace: ${values.namespace}
  labels:
    app.kubernetes.io/managed-by: jay
type: Opaque
data:
  user: ${btoa(values.user)}
  pat: ${btoa(values.pat)}
`.trim()
}

export function yamlFromSpec({ metadata, spec }: Props) {
  return yaml(Object.assign({ user: "", pat: "", namespace: spec.secret.namespace }, metadata, spec))
}
