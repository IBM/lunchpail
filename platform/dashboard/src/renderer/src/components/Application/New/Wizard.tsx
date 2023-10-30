import wordWrap from "word-wrap"
import { useCallback } from "react"
import { useLocation, useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, animals } from "unique-names-generator"

import { type FormContextProps } from "@patternfly/react-core"

import names, { singular } from "../../../names"
import { Checkbox, Input, SelectCheckbox } from "../../Forms"
import { buttonPropsForNewModelData } from "../../../navigate/newmodeldata"

import NewResourceWizard, { type WizardProps as Props } from "../../NewResourceWizard"

import TaskQueueIcon from "../../TaskQueue/Icon"

function repoInput(ctrl: FormContextProps) {
  return (
    <Input
      fieldId="repo"
      label="Source code"
      labelInfo="e.g. https://github.com/myorg/myproject/tree/main/myappsource"
      description="URI to your GitHub repo, which can include the full path to a subdirectory"
      ctrl={ctrl}
    />
  )
}

function image(ctrl: FormContextProps) {
  return <Input fieldId="image" label="Image" description="The base image to run your code on" ctrl={ctrl} />
}

function command(ctrl: FormContextProps) {
  return (
    <Input
      fieldId="command"
      label="Command line"
      description={`The command line used to launch your ${singular.applications}`}
      ctrl={ctrl}
    />
  )
}

function supportsGpu(ctrl: FormContextProps) {
  return (
    <Checkbox
      fieldId="supportsGpu"
      label="Supports GPU?"
      description={`Does your ${singular.applications} support execution on GPUs?`}
      ctrl={ctrl}
      isRequired={false}
    />
  )
}

const step1 = {
  name: "Name",
  isValid: (ctrl: FormContextProps) => !!ctrl.values.name && !!ctrl.values.namespace && !!ctrl.values.description,
  items: ["name" as const, "namespace" as const, "description" as const],
}

const step2 = {
  name: "Code and Dependencies",
  isValid: (ctrl: FormContextProps) => !!ctrl.values.repo && !!ctrl.values.image && !!ctrl.values.command,
  items: [command, repoInput, image, supportsGpu],
}

function yaml(values: FormContextProps["values"]) {
  const apiVersion = "codeflare.dev/v1alpha1"
  const kind = singular.applications
  const taskqueueName = values.taskqueueName ?? values.name.replace(/-/g, "")

  return `
apiVersion: ${apiVersion}
kind: ${kind}
metadata:
  name: ${values.name}
  namespace: ${values.namespace}
  labels:
    codeflare.dev/created-by: user
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: ${values.name}
spec:
  api: workqueue
  repo: ${values.repo}
  image: ${values.image}
  command: /opt/codeflare/worker/bin/watcher.sh ${values.command}
  supportsGpu: ${values.supportsGpu}
  inputs:
    - useas: mount
      sizes:
        xs: ${taskqueueName}
    - useas: mount
      sizes:
        xs: hap-models
  description: >-
${wordWrap(values.description, { trim: true, indent: "    ", width: 60 })}
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
  name: ${taskqueueName + "-cfsecret"}
  namespace: ${values.namespace}
  labels:
    app.kubernetes.io/component: ${values.name}
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: ${values.name}
type: Opaque
data:
  accessKeyID: ${btoa(values.taskqueueAccessKeyId ?? "codeflarey")}
  secretAccessKey: ${btoa(values.taskqueueSecretAccessKey ?? "codeflarey")}
`.trim()
}

export default function NewApplicationWizard(props: Props) {
  const [searchParams] = useSearchParams()

  /** Initial value for form */
  const defaults = useCallback(
    (previousValues?: Record<string, string>) => ({
      name: previousValues?.name ?? uniqueNamesGenerator({ dictionaries: [animals], seed: 1696170097365 + Date.now() }),
      namespace: searchParams.get("namespace") ?? previousValues?.namespace ?? "default",
      repo: previousValues?.repo ?? "",
      image: previousValues?.image ?? "ghcr.io/project-codeflare/codeflare-workerpool-worker-alpine-component:dev",
      command: previousValues?.command ?? "",
      description: previousValues?.description ?? "",
      supportsGpu: previousValues?.supportsGpu ?? "false",
      useTestQueue: previousValues?.useTestQueue ?? "true",
      modeldatas: previousValues?.modeldatas ?? "",
    }),
    [searchParams],
  )

  const modelDatas = useCallback(
    (ctrl: FormContextProps) => (
      <SelectCheckbox
        fieldId="modeldatas"
        label={names.modeldatas}
        description={`Select the "fixed" ${names.modeldatas} this ${singular.applications} needs access to`}
        ctrl={ctrl}
        options={props.modeldatas.sort()}
        icons={<TaskQueueIcon />}
      />
    ),
    [],
  )

  /*const useTestQueueCheckbox = useCallback(
    (ctrl: FormContextProps) => (
      <Checkbox
        fieldId="useTestQueue"
        label="Use Internal Test Task Queue?"
        description="This uses a task queue that requires less configuration, but is less scalable"
        isChecked={ctrl.values.useTestQueue === "true"}
        ctrl={ctrl}
        isDisabled
        isRequired={true}
      />
    ),
    [],
  )*/

  const location = useLocation()
  const registerDataset = (ctrl: FormContextProps) =>
    buttonPropsForNewModelData({ location, searchParams }, { action: "register", namespace: ctrl.values.namespace })

  const step3 = {
    name: names.modeldatas,
    alerts: [
      {
        title: names.modeldatas,
        body: (
          <span>
            If your {singular.applications} needs access to one or more {names.modeldatas}, i.e. global data needed
            across all tasks (e.g. a pre-trained model or a chip design that is being tested across multiple
            configurations), you may supply that information here.
          </span>
        ),
      },
      ...(props.modeldatas.length > 0
        ? []
        : [
            {
              variant: "warning" as const,
              title: "Warning",
              body: <span>No {names.modeldatas} are registered</span>,
              actionLinks: [registerDataset],
            },
          ]),
    ],
    items: props.modeldatas.length === 0 ? [] : [modelDatas],
  }

  /*const step4 = {
    name: singular.taskqueues,
    alerts: [
      {
        title: `Link to a ${singular.taskqueues}`,
        body: (
          <span>
            Your {singular.applications} should register itself as a <strong>consumer</strong> of tasks from a{" "}
            <strong>{singular.taskqueues}</strong>.
          </span>
        ),
      },
    ],
    items: [useTestQueueCheckbox],
  }*/

  const title = `Register ${singular.applications}`
  const steps = [step1, step2, step3]
  return (
    <NewResourceWizard {...props} kind="applications" title={title} defaults={defaults} yaml={yaml} steps={steps}>
      An {singular.applications} is the source code that knows how to consume and then process <strong>Tasks</strong>.
      Once you have registered your {singular.applications}, you can bring online <strong>{names.workerpools}</strong>{" "}
      that run the {singular.applications} against the tasks in a <strong>{singular.taskqueues}</strong>.
    </NewResourceWizard>
  )
}
