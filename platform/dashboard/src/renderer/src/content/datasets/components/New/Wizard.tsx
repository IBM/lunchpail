import { useLocation, useSearchParams } from "react-router-dom"
import type { FormContextProps } from "@patternfly/react-core"
import { useCallback, useEffect, useMemo, useState } from "react"
import { uniqueNamesGenerator, animals } from "unique-names-generator"

import { S3BrowserWithCreds } from "@jaas/components/S3Browser"
import { isNonEmptyArray } from "@jaas/common/util/NonEmptyArray"

import Input from "@jaas/components/Forms/Input"
import Checkbox from "@jaas/components/Forms/Checkbox"
import Password from "@jaas/components/Forms/Password"
import NonInputElement from "@jaas/components/Forms/NonInputElement"
import Tiles, { type TileOption } from "@jaas/components/Forms/Tiles"

import stepUpload from "./Upload"
import { singular } from "@jaas/resources/datasets/name"
import getYaml, { findPlatformRepoSecret, needsPlatformRepoSecret } from "./yaml"

import type ManagedEvents from "@jaas/resources/ManagedEvent"

import type { Profile } from "@jaas/common/api/s3"
import type DataSetEvent from "@jaas/common/events/DataSetEvent"
import NewResourceWizard from "@jaas/components/NewResourceWizard"

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

function isReadonly(ctrl: FormContextProps) {
  return <Checkbox fieldId="readonly" label="Read-only?" description="Disallow changes to the data" ctrl={ctrl} />
}

const stepName = {
  name: "Name",
  isValid: (ctrl: FormContextProps) => !!ctrl.values.name && !!ctrl.values.namespace && !!ctrl.values.description,
  items: ["name" as const, /* "namespace" as const, */ "description" as const, isReadonly],
}

export type Props = Pick<ManagedEvents, "platformreposecrets">

export default function NewDataSetWizard(props: Props) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [buckets, setBuckets] = useState<TileOption[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [missingPrs, setMissingPrs] = useState(false)

  const isEdit = searchParams.has("yaml")

  const yaml = useCallback((values: FormContextProps["values"]) => getYaml(props, values), [props])

  async function refreshBuckets(profile: Omit<Profile, "name">) {
    setBuckets([])
    if (window.jaas.s3) {
      window.jaas.s3
        .listBuckets(profile.endpoint, profile.accessKey, profile.secretKey)
        .then((buckets) =>
          setBuckets(
            buckets.map((_) => ({
              title: _.name,
              value: _.name,
              description: "Created on " + _.creationDate.toLocaleString(),
            })),
          ),
        )
        .catch((err) => {
          console.error(err)
          setBuckets([])
        })
    }
  }

  useEffect(() => {
    if (window.jaas.s3) {
      window.jaas.s3.listProfiles().then(setProfiles)
    }
  }, [window.jaas.s3, setProfiles])

  /** The Select choices for the `profile()` select UI */
  const profileOptions = useMemo<TileOption[]>(
    () =>
      profiles.map((_) => ({
        title: _.name,
        value: _.name,
        description: _.endpoint,
      })),
    [profiles],
  )

  /** Help choose an AWS profile */
  function profile(ctrl: FormContextProps) {
    return !isNonEmptyArray(profileOptions) ? (
      "No AWS profiles found in ~/.credentials"
    ) : (
      <Tiles
        fieldId="profile"
        label="Profile"
        labelInfo="Choose an AWS Profile from ~/.aws/credentials"
        helpText={
          <span>
            {" "}
            These profiles are enumerated from <strong>~/.aws/config</strong> and <strong>~/.aws/credentials</strong>.
            You may add an <strong>endpoint_url=</strong> field under a config profile entry if your S3 endpoint is not
            the standard AWS one.
          </span>
        }
        ctrl={ctrl}
        options={profileOptions}
      />
    )
  }

  /** Help choose a bucket */
  function bucket(ctrl: FormContextProps) {
    return !isNonEmptyArray(buckets) ? (
      "No buckets found"
    ) : (
      <Tiles
        fieldId="bucket"
        label="Bucket"
        labelInfo="Choose an S3 bucket"
        ctrl={ctrl}
        options={buckets}
        currentSelection={buckets.find((_) => _.value === ctrl.values.bucket) ? ctrl.values.bucket : undefined}
      />
    )
  }

  /** An S3Browser to help the user validate choices of endpoint/profile/secrets/bucket */
  function browser(ctrl: FormContextProps) {
    if (window.jaas.s3 && window.jaas.get) {
      const profile = !isEdit ? profiles.find((_) => _.name === ctrl.values.profile) : undefined
      const endpoint = isEdit ? ctrl.values.endpoint : profile?.endpoint
      const accessKey = isEdit ? ctrl.values.accessKey : profile?.accessKey
      const secretKey = isEdit ? ctrl.values.secretAccessKey : profile?.secretKey
      const bucket = ctrl.values.bucket

      if (endpoint && accessKey && secretKey && bucket) {
        return (
          <NonInputElement
            fieldId="s3browser"
            label="S3 Browser"
            labelInfo="This read-only browser helps you validate your Profile and Bucket choices"
          >
            <S3BrowserWithCreds
              s3={window.jaas.s3}
              endpoint={endpoint}
              accessKey={accessKey}
              secretKey={secretKey}
              bucket={bucket}
            />
          </NonInputElement>
        )
      }
    }
    return <></>
  }

  /**
   * We need to do some custom handling when form values change, so
   * that we can reload the set of profiles or buckets.
   */
  const onChange = useCallback(
    async (
      fieldId: string,
      value: string,
      values: FormContextProps["values"],
      setValue: FormContextProps["setValue"] | undefined,
    ) => {
      if (!isEdit) {
        if (fieldId === "profile") {
          if (setValue && value !== values.profile) {
            // profile has changed, invalidate prior choice of bucket
            setValue("bucket", "")
          }

          const profile = profiles.find((_) => _.name === value)
          if (profile) {
            refreshBuckets(profile)
          } else {
            window.jaas.s3?.listProfiles().then((profiles) => {
              setProfiles(profiles)
              const profile = profiles.find((_) => _.name === value)
              if (profile) {
                refreshBuckets(profile)
              }
            })
          }
        } else if (fieldId === "uploadRepo") {
          if (value && needsPlatformRepoSecret(value) && !findPlatformRepoSecret(props, value)) {
            // user just specified the git repo as the origin for an
            // upload to the bucket, but we don't have a repo secret
            // required to pull down the data from the git repo
            setMissingPrs(true)
          } else if (missingPrs) {
            setMissingPrs(false)
          }
        }
      } else if (fieldId === "endpoint" || fieldId === "accessKey" || fieldId === "secretAccessKey") {
        const endpoint = fieldId === "endpoint" ? value : values.endpoint
        const accessKey = fieldId === "accessKey" ? value : values.accessKey
        const secretKey = fieldId === "secretAccessKey" ? value : values.secretAccessKey
        refreshBuckets({ endpoint, accessKey, secretKey })
      }
    },
    [isEdit, profiles, setBuckets, window.jaas.s3],
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

        uploadOrigin: previousValues?.uploadOrigin ?? "",
        uploadRepo: previousValues?.uploadRepo ?? "",
      }
    },
    [searchParams],
  )

  const accessKey = Password({
    fieldId: "accessKey",
    label: "Access Key",
    description: "The access key id for your S3 provider",
  })

  const secretAccessKey = Password({
    fieldId: "secretAccessKey",
    label: "Secret Access Key",
    description: "The secret access key id for your S3 provider",
  })

  const stepProfile = {
    name: isEdit ? "S3 Credentials and Bucket" : "S3 Profile",
    isValid: (ctrl: FormContextProps) =>
      !!ctrl.values.endpoint && !!ctrl.values.accessKey && !!ctrl.values.secretAccessKey,
    items: isEdit ? [endpoint, accessKey, secretAccessKey] : [profile],
  }

  const stepBucket = {
    name: "Bucket",
    isValid: (ctrl: FormContextProps) => !!ctrl.values.bucket,
    items: [bucket, browser],
  }

  /* const stepAttributes = {
    name: "Attributes",
    isValid: (ctrl: FormContextProps) => !!ctrl.values.bucket,
    items: [isReadonly],
  } */

  // are we registering an existing or creating a new one from data supplied here?
  const action = (searchParams.get("action") as "edit" | "create" | "register") ?? "register"

  const title = `${action === "edit" ? "Edit" : action === "register" ? "Register" : "Create"} ${singular}`
  const steps = isEdit
    ? [stepProfile, stepName]
    : [stepProfile, stepBucket, stepUpload(missingPrs, { location, searchParams }), stepName]

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
      A {singular} stores information such as pre-trained model or a chip design that is being tested across multiple
      configurations.
    </NewResourceWizard>
  )
}
