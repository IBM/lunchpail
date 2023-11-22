import wordWrap from "word-wrap"
import type { FormContextProps } from "@patternfly/react-core"

export default function yaml(values: FormContextProps["values"]) {
  // datashim doesn't like dashes in some cases
  const secretName = values.name.replace(/-/g, "") + "cfsecret"

  return `
apiVersion: com.ie.ibm.hpsys/v1alpha1
kind: Dataset
metadata:
  name: ${values.name}
  namespace: ${values.namespace}
  annotations:
    codeflare.dev/description: >-
${wordWrap(values.description, { trim: true, indent: "      ", width: 60 })}
  labels:
    codeflare.dev/created-by: user
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: dataset
spec:
  local:
    type: "COS"
    bucket: ${values.bucket ?? values.name}
    endpoint: ${values.endpoint ?? "http://codeflare-s3.codeflare-system.svc.cluster.local:9000"}
    readonly: "${values.readonly ?? "false"}"
    secret-name: ${secretName}
    secret-namespace: ${values.namespace}
    provision: "true"
---
apiVersion: v1
kind: Secret
metadata:
  name: ${secretName}
  namespace: ${values.namespace}
  labels:
    app.kubernetes.io/component: ${values.name}
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: ${values.name}
type: Opaque
data:
  accessKeyID: ${btoa(values.accessKey ?? "codeflarey")}
  secretAccessKey: ${btoa(values.secretAccessKey ?? "codeflarey")}
`.trim()
}
