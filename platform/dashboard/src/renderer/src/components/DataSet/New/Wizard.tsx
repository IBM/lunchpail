import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, animals } from "unique-names-generator"

import { type FormContextProps } from "@patternfly/react-core"

import { singular } from "../../../names"
import { Checkbox, Input } from "../../Forms"

import NewResourceWizard, { password, type WizardProps as Props } from "../../NewResourceWizard"

function endpoint(ctrl: FormContextProps) {
  return (
    <Input
      fieldId="endpoint"
      label="Endpoint"
      labelInfo="e.g. https://s3.us-east.cloud-object-storage.appdomain.cloud"
      description="URL of the S3 endpoint"
      ctrl={ctrl}
    />
  )
}

function bucket(ctrl: FormContextProps) {
  return <Input fieldId="bucket" label="Bucket" description="Name of S3 bucket" ctrl={ctrl} />
}

const step1 = {
  name: "Name",
  isValid: (ctrl: FormContextProps) => !!ctrl.values.name && !!ctrl.values.namespace && !!ctrl.values.description,
  items: ["name" as const, "namespace" as const, "description" as const],
}

const step2Create = {
  name: "Upload the Data",
  isValid: (ctrl: FormContextProps) => !!ctrl.values.repo && !!ctrl.values.image && !!ctrl.values.command,
  items: [],
}

function isReadonly(ctrl: FormContextProps) {
  return (
    <Checkbox
      fieldId="readonly"
      label="Read-only?"
      description="Restrict access to disallow changes to the data"
      ctrl={ctrl}
    />
  )
}

function yaml(values: FormContextProps["values"]) {
  // datashim doesn't like dashes in some cases
  const secretName = values.name.replace(/-/g, "") + "cfsecret"

  return `
apiVersion: com.ie.ibm.hpsys/v1alpha1
kind: Dataset
metadata:
  name: ${values.name}
  namespace: ${values.namespace}
  labels:
    codeflare.dev/created-by: user
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: dataset
spec:
  local:
    type: "COS"
    bucket: ${values.bucket ?? values.name}
    endpoint: ${values.endpoint ?? "http://codeflare-s3.codeflare-system.svc.cluster.local:9000"}
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

export default function NewApplicationWizard(props: Props) {
  const [searchParams] = useSearchParams()

  /** Initial value for form */
  const defaults = useCallback(
    (previousValues?: Record<string, string>) => ({
      name: previousValues?.name ?? uniqueNamesGenerator({ dictionaries: [animals], seed: 1696170097365 + Date.now() }),
      namespace: searchParams.get("namespace") ?? previousValues?.namespace ?? "default",
      description: previousValues?.description ?? "",
      endpoint: previousValues?.endpoint ?? "",
      readonly: previousValues?.readonly ?? "true",
      bucket: previousValues?.bucket ?? "",
      accessKey: previousValues?.accessKey ?? "",
      secretAccessKey: previousValues?.secretAccessKey ?? "",
    }),
    [searchParams],
  )

  const accessKey = password({
    fieldId: "accessKey",
    label: "Access Key",
    description: "The access key id for your S3 provider",
  })

  const secretAccessKey = password({
    fieldId: "secretAccessKey",
    label: "Secret Access Key",
    description: "The secret access key id for your S3 provider",
  })

  const step2Register = {
    name: "Cloud endpoint",
    isValid: (ctrl: FormContextProps) =>
      !!ctrl.values.endpoint && !!ctrl.values.accessKey && !!ctrl.values.secretAccessKey,
    items: [endpoint, accessKey, secretAccessKey],
  }

  const step3 = {
    name: "Cloud path",
    isValid: (ctrl: FormContextProps) => !!ctrl.values.bucket,
    items: [bucket],
  }

  const step4 = {
    name: "Attributes",
    isValid: (ctrl: FormContextProps) => !!ctrl.values.bucket,
    items: [isReadonly],
  }

  // are we registering an existing or creating a new one from data supplied here?
  const action = searchParams.get("action") ?? "register"

  const title = `${action === "register" ? "Register" : "Create"} ${singular.datasets}`
  const steps =
    action === "register" ? [step1, step2Register, step3, step4] : [step1, step2Create, step2Register, step3, step4]

  return (
    <NewResourceWizard {...props} kind="datasets" title={title} defaults={defaults} yaml={yaml} steps={steps}>
      An {singular.datasets} stores information that is not specific to any one Task in a {singular.taskqueues}, e.g. a
      pre-trained model or a chip design that is being tested across multiple configurations.{" "}
      {action === "register" ? (
        <span>
          This wizard helps you to <strong>register an existing {singular.datasets}</strong> that is already stored in
          the Cloud.
        </span>
      ) : (
        <span>
          This wizard helps you to create a <strong>new {singular.datasets}</strong> from data supplied here.
        </span>
      )}
    </NewResourceWizard>
  )
}
