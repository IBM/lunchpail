import wordWrap from "word-wrap"
import indent from "@jay/common/util/indent"

import type { SupportedLanguage } from "@jay/components/Code"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

/** How the user wants to specify the code */
export type Method = "github" | "literal"

export type YamlProps = Pick<ApplicationSpecEvent["metadata"], "name" | "namespace"> &
  Pick<ApplicationSpecEvent["spec"], "repo" | "image" | "command" | "description" | "code"> & {
    /** Serialized JSON array of datasets to mount */
    datasets: string

    /** We need a string form of this boolean property of `ApplicationSpecEvent` */
    supportsGpu: string

    /** How the user wants to specify the code */
    method: Method

    /** If code is provided via literal, the source language */
    codeLanguage: Exclude<SupportedLanguage, "json" | "yaml">

    taskqueueName?: string
    taskqueueBucket?: string
    taskqueueEndpoint?: string
    taskqueueAccessKeyId?: string
    taskqueueSecretAccessKey?: string
  }

/**
 * @return the yaml spec to create/delete an Application
 */
export default function yaml(values: YamlProps) {
  const taskqueueName = values.taskqueueName ?? values.name.replace(/-/g, "")

  const datasetsToMount = !values.datasets
    ? ""
    : JSON.parse(values.datasets)
        .map((datasetName) =>
          `
- useas: mount
  sizes:
    xs: ${datasetName}
`.trim(),
        )
        .join("\n")

  return `
apiVersion: codeflare.dev/v1alpha1
kind: Application
metadata:
  name: ${values.name}
  namespace: ${values.namespace}
  labels:
    codeflare.dev/created-by: user
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: ${values.name}
spec:
  api: workqueue
${
  values.method === "literal" && values.code
    ? `  code: |
${indent(values.code.trim(), 4)}`
    : ""
}
${values.method === "github" ? `  repo: ${values.repo}` : ""}
${values.method === "github" ? `  image: ${values.image}` : ""}
${
  values.method === "literal"
    ? values.codeLanguage === "python"
      ? `  image: ghcr.io/project-codeflare/codeflare-workerpool-worker-alpine-python-component:dev`
      : `  image: ghcr.io/project-codeflare/codeflare-workerpool-worker-alpine-component:dev`
    : ""
}
  command: /opt/codeflare/worker/bin/watcher.sh ${
    values.method === "literal" ? commandFromCodeLanguage(values.codeLanguage) : values.command
  }
  supportsGpu: ${values.supportsGpu}
  inputs:
    - useas: mount
      sizes:
        xs: ${taskqueueName}
${indent(datasetsToMount, 4)}
  description: >-
${wordWrap(values.description, { trim: true, indent: "    ", width: 60 })}
---
apiVersion: codeflare.dev/v1alpha1
kind: Run
metadata:
  name: ${values.name}
  namespace: ${values.namespace}
spec:
  workers: 0
  application:
    name: ${values.name}
---
apiVersion: com.ie.ibm.hpsys/v1alpha1
kind: Dataset
metadata:
  name: ${taskqueueName}
  namespace: ${values.namespace}
  labels:
    codeflare.dev/created-by: user
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: taskqueue
spec:
  local:
    type: "COS"
    bucket: ${values.taskqueueBucket ?? values.name}
    endpoint: ${values.taskqueueEndpoint ?? "http://codeflare-s3.codeflare-system.svc.cluster.local:9000"}
    secret-name: ${taskqueueName + "cfsecret"}
    secret-namespace: ${values.namespace}
    provision: "true"
---
apiVersion: v1
kind: Secret
metadata:
  name: ${taskqueueName + "cfsecret"}
  namespace: ${values.namespace}
  labels:
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: ${values.name}
type: Opaque
data:
  accessKeyID: ${btoa(values.taskqueueAccessKeyId ?? "codeflarey")}
  secretAccessKey: ${btoa(values.taskqueueSecretAccessKey ?? "codeflarey")}
`.trim()
}

export function codeLanguageFromCommand(command: string): YamlProps["codeLanguage"] {
  const A = command.split(/\s+/)
  const file = A[A.length - 1]
  return file.endsWith(".py") ? "python" : "shell"
}

export function codeLanguageFromMaybeCommand(command: undefined | string) {
  return !command ? undefined : codeLanguageFromCommand(command)
}

function commandFromCodeLanguage(codeLanguage: SupportedLanguage) {
  // dot-slash the shell script to help with bash finding it on PATH
  const prefix = codeLanguage === "python" ? "" : "./"
  const ext = codeLanguage === "python" ? ".py" : ".sh"
  const launcher = codeLanguage === "python" ? "python -u" : ""
  return `${launcher} ${prefix}literal${ext}`
}

export function yamlFromSpec({ metadata, spec }: ApplicationSpecEvent) {
  // supportsGpu boolean -> string
  const { supportsGpu, ...rest } = spec

  return yaml(
    Object.assign(
      {
        method: spec.repo ? ("github" as const) : ("literal" as const),
        inputSchema: "",
        datasets: "",
        codeLanguage: codeLanguageFromCommand(spec.command),
        supportsGpu: supportsGpu ? "true" : "false",
      },
      metadata,
      rest,
    ),
  )
}
