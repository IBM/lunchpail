import removeAccents from "remove-accents"
import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, starWars } from "unique-names-generator"

import Input from "@jay/components/Forms/Input"
import NumberInput from "@jay/components/Forms/NumberInput"
import NewResourceWizard from "@jay/components/NewResourceWizard"
import Tiles, { type TileOptions } from "@jay/components/Forms/Tiles"
import KubernetesContexts from "@jay/components/Forms/KubernetesContexts"

import { singular as workerpool } from "@jay/resources/workerpools/name"
import { groupSingular as application } from "@jay/resources/applications/group"

import type Target from "./Target"
import type Values from "./Values"

import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

type Props = {
  taskqueues: TaskQueueEvent[]
  applications: ApplicationSpecEvent[]
}

const targetOptions: TileOptions<Target> = [
  {
    title: "Local",
    value: "local",
    description: "Run the workers on your laptop, as Pods in a local Kubernetes cluster that will be managed for you",
  },
  {
    title: "Existing Kubernetes Cluster",
    value: "kubernetes",
    description: "Run the workers as Pods in an existing Kubernetes cluster",
  },
  {
    title: "IBM Cloud VSIs",
    value: "ibmcloudvsi",
    description: "Run the workers on IBM Cloud Virtual Storage Instances",
    isDisabled: true,
  },
]

export default function NewWorkerPoolWizard(props: Props) {
  const [searchParams] = useSearchParams()

  /** Try to associate with a Task Queue? */
  const searchedTaskQueue = chooseTaskQueueIfExists(props.taskqueues, searchParams.get("taskqueue"))

  /** If we are trying to associate with a particular Task Queue, then filter Applications list down to those compatible with it */
  const compatibleApplications = searchedTaskQueue
    ? props.applications.filter((app) => supportsTaskQueue(app, searchedTaskQueue))
    : props.applications

  /** Initial value for form */
  const defaults = useCallback((previousValues?: Values["values"]) => {
    return {
      target: previousValues?.target ?? "local",
      kubecontext: previousValues?.kubecontext ?? "",
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
  }, [])

  function applicationChoice(ctrl: Values) {
    return (
      <Input
        readOnlyVariant="default"
        fieldId="application"
        label={application}
        description={`The workers in this ${workerpool} will run the code specified by this ${application}`}
        ctrl={ctrl}
      />
    )
  }

  function targets(ctrl: Values) {
    return (
      <Tiles
        ctrl={ctrl}
        fieldId="target"
        label="Compute Target"
        description="Where do you want the workers to run?"
        options={targetOptions}
      />
    )
  }

  const stepTarget = {
    name: "Choose where to run the workers",
    isValid: (ctrl: Values) => {
      if (ctrl.values.target === "kubernetes") {
        return !!ctrl.values.kubecontext
      } else {
        return true
      }
    },
    items: (ctrl: Values) => [
      targets(ctrl),
      ...(ctrl.values.target === "kubernetes"
        ? [<KubernetesContexts<Values> ctrl={ctrl} description="Choose a target Kubernetes cluster for the workers" />]
        : []),
    ],
  }

  const stepConfigure = {
    name: "Configure your " + workerpool,
    isValid: (ctrl: Values) => !!ctrl.values.name && !!ctrl.values.application && !!ctrl.values.taskqueue,
    items: ["name" as const, applicationChoice, /* taskqueue, */ numWorkers],
  }

  function yaml(values: Values["values"]) {
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

  const title = `Create ${workerpool}`
  const steps = [stepTarget, stepConfigure]
  return (
    <NewResourceWizard<Values>
      kind="workerpools"
      title={title}
      singular={workerpool}
      defaults={defaults}
      yaml={yaml}
      steps={steps}
    >
      Configure a pool of workers to process Tasks, using the Code and Data bindings of a given {application}.
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
function numWorkers(ctrl: Values) {
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
