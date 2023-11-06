import { useMemo } from "react"
import removeAccents from "remove-accents"
import { useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, starWars } from "unique-names-generator"

import { type FormContextProps } from "@patternfly/react-core"

import TaskQueueIcon from "../../../taskqueues/components/Icon"
import ApplicationIcon from "../../../applications/components/Icon"

import { NumberInput, Select } from "@jay/components/Forms"
import NewResourceWizard from "@jay/components/NewResourceWizard"

import { singular } from "../../name"
import { singular as taskqueuesSingular } from "../../../taskqueues/name"
import { singular as workerpoolsSingular } from "../../../workerpools/name"
import { singular as applicationsSingular } from "../../../applications/name"

import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

type Props = {
  taskqueues: TaskQueueEvent[]
  applications: ApplicationSpecEvent[]
}

export default function NewWorkerPoolWizard(props: Props) {
  const [searchParams] = useSearchParams()

  /** Try to associate with a Task Queue? */
  const searchedTaskQueue = chooseTaskQueueIfExists(props.taskqueues, searchParams.get("taskqueue"))

  /** If we are trying to associate with a particular Task Queue, then filter Applications list down to those compatible with it */
  const compatibleApplications = searchedTaskQueue
    ? props.applications.filter((app) => supportsTaskQueue(app, searchedTaskQueue))
    : props.applications

  /** Presented Select options of Applications */
  const applicationOptions = useMemo(
    () =>
      compatibleApplications.map((_) => ({
        value: _.metadata.name,
        description: <div className="codeflare--max-width-30em">{_.spec.description}</div>,
      })),
    [searchedTaskQueue, props.applications],
  )

  /** Initial value for form */
  function defaults() {
    return {
      name:
        (searchedTaskQueue ? searchedTaskQueue + "-pool-" : "") +
        removeAccents(
          uniqueNamesGenerator({ dictionaries: [starWars], length: 1, style: "lowerCase" }).replace(/\s/g, "-"),
        ),
      count: String(1),
      size: "xs",
      supportsGpu: false.toString(),
      application: chooseIfSingleton(compatibleApplications),
      taskqueue:
        props.taskqueues.length === 1
          ? props.taskqueues[0].metadata.name
          : chooseTaskQueueIfExists(props.taskqueues, searchedTaskQueue),
    }
  }

  function application(ctrl: FormContextProps) {
    return (
      <Select
        fieldId="application"
        label={applicationsSingular}
        description={`Choose the ${applicationsSingular} code this pool should run`}
        ctrl={ctrl}
        options={applicationOptions}
        icons={compatibleApplications.map((application) => (
          <ApplicationIcon application={application} />
        ))}
      />
    )
  }

  function taskqueue(ctrl: FormContextProps) {
    return (
      <Select
        ctrl={ctrl}
        fieldId="taskqueue"
        icons={<TaskQueueIcon />}
        options={props.taskqueues}
        label={taskqueuesSingular}
        description={`Choose the ${taskqueuesSingular} this pool should process`}
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
`.trim()
  }

  const title = `Create ${workerpoolsSingular}`
  const steps = [step1]
  return (
    <NewResourceWizard
      kind="workerpools"
      title={title}
      singular={singular}
      defaults={defaults}
      yaml={yaml}
      steps={steps}
    >
      Configure a pool of compute resources to process Tasks in a Queue.
    </NewResourceWizard>
  )
}

/** @return A[0] if A.length is 1 */
function chooseIfSingleton(A: ApplicationSpecEvent[]): string {
  return A.length === 1 ? A[0].metadata.name : ""
}

/** If the user desires to associate this Worker Pool with a given `desired` Task Queue, make sure it exists */
function chooseTaskQueueIfExists(available: Props["taskqueues"], desired: null | string) {
  if (desired && available.find((_) => _.metadata.name === desired)) {
    return desired
  } else {
    return ""
  }
}

/** @return whether the given Application supports the given Task Queue */
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

/** Form element to choose number of workers in this new Worker Pool */
function numWorkers(ctrl: FormContextProps) {
  return (
    <NumberInput
      min={1}
      ctrl={ctrl}
      fieldId="count"
      label="Worker count"
      description="Number of Workers in this pool"
      defaultValue={ctrl.values.count ? parseInt(ctrl.values.count, 10) : 1}
    />
  )
}
