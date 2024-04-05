import wordWrap from "word-wrap"
import indent from "@jaas/common/util/indent"
import type { FormContextProps } from "@patternfly/react-core"

import type { Props } from "./Wizard"

/** datashim doesn't like dashes in some cases */
function secretName(values: FormContextProps["values"]) {
  return values.name.replace(/-/g, "") + "cfsecret"
}

function endpoint(values: FormContextProps["values"]) {
  return values.endpoint
}

function isReadOnly(values: FormContextProps["values"]): boolean {
  return values.readonly === "true"
}

function yamlForDataSet(values: FormContextProps["values"]) {
  return `
apiVersion: com.ie.ibm.hpsys/v1alpha1
kind: Dataset
metadata:
  name: ${values.name}
  namespace: ${values.namespace}
  annotations:
    lunchpail.io/description: >-
${wordWrap(values.description, { trim: true, indent: "      ", width: 60 })}
  labels:
    lunchpail.io/created-by: user
    app.kubernetes.io/part-of: lunchpail.io
    app.kubernetes.io/component: dataset
spec:
  local:
    type: "COS"
    bucket: ${values.bucket ?? values.name}
    endpoint: ${endpoint(values)}
    readonly: "${String(isReadOnly(values))}"
    secret-name: ${secretName(values)}
    secret-namespace: ${values.namespace}
    provision: "true"
`.trim()
}

function yamlForSecret(values: FormContextProps["values"]) {
  return `
apiVersion: v1
kind: Secret
metadata:
  name: ${secretName(values)}
  namespace: ${values.namespace}
  labels:
    app.kubernetes.io/component: ${values.name}
    app.kubernetes.io/part-of: lunchpail.io
    app.kubernetes.io/component: ${values.name}
type: Opaque
data:
  accessKeyID: ${btoa(values.accessKey ?? "codeflarey")}
  secretAccessKey: ${btoa(values.secretAccessKey ?? "codeflarey")}
`.trim()
}

export function needsPlatformRepoSecret(repo: string) {
  return !/https:\/\/github.com\//.test(repo)
}

export function findPlatformRepoSecret(props: Props, repo: string) {
  const prs = props.platformreposecrets.find((_) => new RegExp(_.spec.repo).test(repo))
  if (prs) {
    return prs.spec.secret.name
  } else {
    return undefined
  }
}

/** If user wishes to upload data *from git* to the new DataSet */
function yamlForGit(props: Props, values: FormContextProps["values"]) {
  const repoSecret = needsPlatformRepoSecret(values.uploadRepo)
    ? findPlatformRepoSecret(props, values.uploadRepo)
    : null

  if (repoSecret === undefined) {
    console.error("Error: no matching PlatformRepoSecret")
    // TODO alert user
    return []
  }

  const repoSecretRef =
    repoSecret === null
      ? ""
      : `
- secretRef
    name: ${repoSecret}
    prefix: COPYIN`.trim()

  return [
    `
apiVersion: batch/v1
kind: Job
metadata:
  name: ${values.name}-git-copyin
  namespace: ${values.namespace}
spec:
  ttlSecondsAfterFinished: 200
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: copyin
        image: ghcr.io/project-codeflare/codeflare-s3-copy-in-component:dev
        envFrom:
        - secretRef:
            name: ${secretName(values)}
  ${indent(repoSecretRef, 6)}
        env:
        - name: S3_ENDPOINT
          value: ${endpoint(values)}
        - name: COPYIN_BUCKET
          value: ${values.bucket}
        - name: COPYIN_ORIGIN
          value: ${values.uploadOrigin}
        - name: COPYIN_REPO
          value: ${values.uploadRepo}
`.trim(),
  ]
}

/** If user wishes to upload data to the new DataSet */
function yamlsForUpload(props: Props, values: FormContextProps["values"]) {
  switch (values.uploadOrigin) {
    case "git":
      return [...yamlForGit(props, values)]
    default:
      return []
  }
}

export default function yaml(props: Props, values: FormContextProps["values"]) {
  return [yamlForDataSet(values), yamlForSecret(values), ...yamlsForUpload(props, values)].join("\n---\n")
}
