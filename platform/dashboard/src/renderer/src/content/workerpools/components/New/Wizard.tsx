import { useCallback } from "react"
import removeAccents from "remove-accents"
import indent from "@jay/common/util/indent"
import { useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, starWars } from "unique-names-generator"

import NewResourceWizard from "@jay/components/NewResourceWizard"

import { singular as workerpool } from "@jay/resources/workerpools/name"
import { groupSingular as application } from "@jay/resources/applications/group"

import type Values from "./Values"

import stepName from "./steps/name"
import stepTarget from "./steps/target"
import stepConfigure from "./steps/configure"

import { type KubeConfig } from "@jay/common/api/kubernetes"
import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

type Props = {
  taskqueues: TaskQueueEvent[]
  applications: ApplicationSpecEvent[]
}

/**
 * Strip `config` to allow access only to the given `context`.
 */
function stripKubeconfig(config: KubeConfig, context: string): KubeConfig {
  const configObj = config.contexts.find((_) => _.name === context)
  if (!configObj) {
    // TODO report to user
    console.error("Cannot find given context in given config", context, config)
    return config
  }

  return Object.assign({}, config, {
    contexts: config.contexts.filter((_) => _.name === context),
    users: config.users.filter((_) => _.name === configObj.context.user),
    clusters: config.clusters.filter((_) => _.name === configObj.context.cluster),
  })
}

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

  const yaml = useCallback(
    async (values: Values["values"]) => {
      const applicationSpec = props.applications.find((_) => _.metadata.name === values.application)
      if (!applicationSpec) {
        console.error("Internal error: Application spec not found", values.application)
        // TODO how do we report this to the UI?
      }

      // TODO re: internal-error
      const namespace = applicationSpec ? applicationSpec.metadata.namespace : "internal-error"

      // fetch kubeconfig
      const kubeconfig =
        values.target !== "kubernetes" || !window.jay.contexts
          ? undefined
          : await window.jay
              .contexts()
              .then(({ config }) =>
                btoa(
                  JSON.stringify(stripKubeconfig(config, values.kubecontext)).replace(
                    /127\.0\.0\.1/g,
                    "host.docker.internal",
                  ),
                ),
              )

      // details for the target
      const target =
        values.target === "kubernetes"
          ? `
target:
  kubernetes:
    context: ${values.kubecontext}
    config:
      value: ${kubeconfig}
`.trim()
          : ""

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
${indent(target, 2)}
`.trim()
    },
    [props.applications, window.jay.contexts],
  )

  const title = `Create ${workerpool}`
  const steps = [stepTarget, stepConfigure, stepName]
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
