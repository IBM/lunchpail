import wordWrap from "word-wrap"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, animals } from "unique-names-generator"
import { type FormContextProps, type SelectOptionProps } from "@patternfly/react-core"

import { Checkbox, Input, Select } from "@jay/components/Forms"

import { singular } from "../../name"
import { singular as taskqueuesSingular } from "../../../taskqueues/name"

import type { Profile } from "@jay/common/api/s3"
import type DataSetEvent from "@jay/common/events/DataSetEvent"
import NewResourceWizard, { password } from "@jay/components/NewResourceWizard"

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

export default function NewDataSetWizard() {
  const [searchParams] = useSearchParams()
  const [buckets, setBuckets] = useState<SelectOptionProps[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])

  const isEdit = searchParams.has("yaml")

  useEffect(() => {
    if (window.jay.s3) {
      window.jay.s3.listProfiles().then(setProfiles)
    }
  }, [window.jay.s3, setProfiles])

  const profileOptions = useMemo<SelectOptionProps[]>(
    () => profiles.map((_) => ({ value: _.name, description: _.endpoint })),
    [profiles],
  )

  function profile(ctrl: FormContextProps) {
    return (
      <Select
        fieldId="profile"
        label="Profile"
        description="Choose an AWS Profile"
        ctrl={ctrl}
        options={profileOptions}
      />
    )
  }

  function bucket(ctrl: FormContextProps) {
    return <Select fieldId="bucket" label="Bucket" description="Name of S3 bucket" ctrl={ctrl} options={buckets} />
  }

  function refreshBuckets(profile: Omit<Profile, "name">) {
    setBuckets([])
    if (window.jay.s3) {
      window.jay.s3
        .listBuckets(profile.endpoint, profile.accessKey, profile.secretKey)
        .then((buckets) =>
          setBuckets(
            buckets.map((_) => ({ value: _.name, description: "Created on " + _.creationDate.toLocaleString() })),
          ),
        )
        .catch((err) => {
          console.error(err)
          setBuckets([])
        })
    }
  }

  const onChange = useCallback(
    (fieldId: string, value: string, values: FormContextProps["values"]) => {
      if (!isEdit) {
        if (fieldId === "profile") {
          const profile = profiles.find((_) => _.name === value)
          if (profile) {
            refreshBuckets(profile)
          }
        }
      } else if (fieldId === "endpoint" || fieldId === "accessKey" || fieldId === "secretAccessKey") {
        const endpoint = fieldId === "endpoint" ? value : values.endpoint
        const accessKey = fieldId === "accessKey" ? value : values.accessKey
        const secretKey = fieldId === "secretAccessKey" ? value : values.secretAccessKey
        refreshBuckets({ endpoint, accessKey, secretKey })
      }
    },
    [isEdit, profiles, setBuckets, window.jay.s3],
  )

  /** Initial value for form */
  const defaults = useCallback(
    (previousValues?: Record<string, string>) => {
      // are we editing an existing resource `rsrc`? if so, populate
      // the form defaults from its values
      const yaml = searchParams.get("yaml")
      const rsrc = yaml ? (JSON.parse(decodeURIComponent(yaml)) as DataSetEvent) : undefined

      return {
        name:
          rsrc?.metadata.name ??
          previousValues?.name ??
          uniqueNamesGenerator({ dictionaries: [animals], seed: 1696170097365 + Date.now() }),
        namespace: rsrc?.metadata.namespace ?? searchParams.get("namespace") ?? previousValues?.namespace ?? "default",
        description: previousValues?.description ?? "",
        profile: previousValues?.profile ?? "",
        endpoint: rsrc?.spec.local.endpoint ?? previousValues?.endpoint ?? "",
        readonly: rsrc?.spec.local.readonly?.toString() ?? previousValues?.readonly ?? "true",
        bucket: rsrc?.spec.local.bucket ?? previousValues?.bucket ?? "",
        accessKey: previousValues?.accessKey ?? "",
        secretAccessKey: previousValues?.secretAccessKey ?? "",
      }
    },
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

  const step2 = {
    name: isEdit ? "S3 Credentials and Bucket" : "S3 Provider and Bucket",
    isValid: (ctrl: FormContextProps) =>
      !!ctrl.values.endpoint && !!ctrl.values.accessKey && !!ctrl.values.secretAccessKey,
    items: isEdit ? [endpoint, accessKey, secretAccessKey, bucket] : [profile, bucket],
  }

  const step4 = {
    name: "Attributes",
    isValid: (ctrl: FormContextProps) => !!ctrl.values.bucket,
    items: [isReadonly],
  }

  // are we registering an existing or creating a new one from data supplied here?
  const action = (searchParams.get("action") as "edit" | "create" | "register") ?? "register"

  const title = `${action === "edit" ? "Edit" : action === "register" ? "Register" : "Create"} ${singular}`
  const steps = action !== "create" ? [step1, step2, step4] : [step1, step2Create, step2, step4]

  return (
    <NewResourceWizard
      kind="datasets"
      title={title}
      singular={singular}
      defaults={defaults}
      yaml={yaml}
      steps={steps}
      action={action === "create" ? "register" : action}
      onChange={onChange}
    >
      An {singular} stores information that is not specific to any one Task in a {taskqueuesSingular}, e.g. a
      pre-trained model or a chip design that is being tested across multiple configurations.{" "}
      {action === "register" ? (
        <span>
          This wizard helps you to <strong>register an existing {singular}</strong> that is already stored in the Cloud.
        </span>
      ) : (
        <span>
          This wizard helps you to create a <strong>new {singular}</strong> from data supplied here.
        </span>
      )}
    </NewResourceWizard>
  )
}
