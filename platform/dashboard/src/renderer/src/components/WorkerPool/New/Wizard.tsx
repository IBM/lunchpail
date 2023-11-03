import removeAccents from "remove-accents"
import { useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, starWars } from "unique-names-generator"

import { type FormContextProps } from "@patternfly/react-core"

import TaskQueueIcon from "../../TaskQueue/Icon"
import ApplicationIcon from "../../Application/Icon"

import { singular } from "../../../names"
import { NumberInput, Select } from "../../Forms"
import NewResourceWizard, { type WizardProps as Props } from "../../NewResourceWizard"

import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

export default function NewWorkerPoolWizard(props: Props) {
  const [searchParams] = useSearchParams()

  function chooseTaskQueueIfExists(available: Props["taskqueues"], desired: null | string) {
    if (desired && available.includes(desired)) {
      return desired
    } else {
      return ""
    }
  }

  function searchedTaskQueue() {
    const taskqueue = searchParams.get("taskqueue")
    if (!taskqueue || !props.taskqueues.includes(taskqueue)) {
      return null
    } else {
      return taskqueue
    }
  }

  function supportsTaskQueue(app: ApplicationSpecEvent, taskqueue: string) {
    const taskqueues = app.spec.inputs ? app.spec.inputs[0].sizes : undefined
    return (
      taskqueues &&
      (taskqueues.xs === taskqueue ||
        taskqueues.sm === taskqueue ||
        taskqueues.md === taskqueue ||
        taskqueues.lg === taskqueue ||
        taskqueues.xl === taskqueue)
    )
  }

  function compatibleApplications() {
    const taskqueue = searchedTaskQueue()
    if (taskqueue) {
      return props.applications.filter((app) => supportsTaskQueue(app, taskqueue))
    } else {
      return props.applications
    }
  }

  function chooseIfSingleton(A: ApplicationSpecEvent[]): string {
    return A.length === 1 ? A[0].metadata.name : ""
  }

  /** Initial value for form */
  function defaults() {
    return {
      name: removeAccents(
        uniqueNamesGenerator({ dictionaries: [starWars], length: 1, style: "lowerCase" }).replace(/\s/g, "-"),
      ),
      count: String(1),
      size: "xs",
      supportsGpu: false.toString(),
      application: chooseIfSingleton(compatibleApplications()),
      taskqueue:
        props.taskqueues.length === 1
          ? props.taskqueues[0]
          : chooseTaskQueueIfExists(props.taskqueues, searchedTaskQueue()),
    }
  }

  function application(ctrl: FormContextProps) {
    return (
      <Select
        fieldId="application"
        label={singular.applications}
        description={`Choose the ${singular.applications} code this pool should run`}
        ctrl={ctrl}
        options={compatibleApplications().map((_) => ({
          value: _.metadata.name,
          description: <div className="codeflare--max-width-30em">{_.spec.description}</div>,
        }))}
        icons={compatibleApplications().map(ApplicationIcon)}
      />
    )
  }

  function taskqueue(ctrl: FormContextProps) {
    return (
      <Select
        fieldId="taskqueue"
        label={singular.taskqueues}
        description={`Choose the ${singular.taskqueues} this pool should process`}
        ctrl={ctrl}
        options={props.taskqueues.sort()}
        icons={<TaskQueueIcon />}
      />
    )
  }

  function numWorkers(ctrl: FormContextProps) {
    return (
      <NumberInput
        fieldId="count"
        label="Worker count"
        description="Number of Workers in this pool"
        ctrl={ctrl}
        defaultValue={ctrl.values.count ? parseInt(ctrl.values.count, 10) : 1}
        min={1}
      />
    )
  }

  const step1 = {
    name: "Configure",
    isValid: (ctrl: FormContextProps) => !!ctrl.values.name && !!ctrl.values.application && !!ctrl.values.taskqueue,
    items: ["name" as const, application, taskqueue, numWorkers],
  }

  function yaml(values: FormContextProps["values"]) {
    const applicationSpec = props.applications.find((_) => _.metadata.name === values.application)
    if (!applicationSpec) {
      console.error("Internal error: Application spec not found", values.application)
      // TODO how do we report this to the UI?
    }

    // TODO re: internal-error
    const namespace = applicationSpec ? applicationSpec.metadata.namespace : "internal-error"

    return `
apiVersion: codeflare.dev/v1alpha1
kind: WorkerPool
metadata:
  name: ${values.name}
  namespace: ${namespace}
spec:
  dataset: ${values.taskqueue}
  application:
    name: ${values.application}
  workers:
    count: ${values.count}
    size: ${values.size}
    supportsGpu: ${values.supportsGpu}
`
  }

  const title = `Create ${singular.workerpools}`
  const steps = [step1]
  return (
    <NewResourceWizard {...props} kind="workerpools" title={title} defaults={defaults} yaml={yaml} steps={steps}>
      Configure a pool of compute resources to process Tasks in a Queue.
    </NewResourceWizard>
  )
}
