import { useCallback, useMemo } from "react"
import removeAccents from "remove-accents"
import { useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, starWars } from "unique-names-generator"

import NewResourceWizard from "@jay/components/NewResourceWizard"

import { singular as workerpool } from "@jay/resources/workerpools/name"
import { groupSingular as application } from "@jay/resources/applications/group"

import type { TileOptions } from "@jay/components/Forms/Tiles"

import type Values from "./Values"

import yaml from "./yaml"

import stepName from "./steps/name"
import stepTarget from "./steps/target"
import stepConfigure from "./steps/configure"

import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"
import type ComputeTargetEvent from "@jay/common/events/ComputeTargetEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

type Props = {
  taskqueues: TaskQueueEvent[]
  applications: ApplicationSpecEvent[]
  computetargets: ComputeTargetEvent[]
}

export type Context = Pick<Props, "applications"> & {
  targetOptions: TileOptions
}

export default function NewWorkerPoolWizard(props: Props) {
  const [searchParams] = useSearchParams()

  /** Try to associate with a Task Queue? */
  const searchedTaskQueue = chooseTaskQueueIfExists(props.taskqueues, searchParams.get("taskqueue"))

  /** If we are trying to associate with a particular Task Queue, then filter Applications list down to those compatible with it */
  const compatibleApplications = useMemo(
    () =>
      searchedTaskQueue
        ? props.applications.filter((app) => supportsTaskQueue(app, searchedTaskQueue))
        : props.applications,
    [props.applications],
  )

  /** Initial value for form */
  const defaults = useCallback(
    (previousValues?: Values["values"]) => {
      // make sure the previous selection is still a valid one
      const target =
        previousValues?.target && props.computetargets.find((_) => _.metadata.name === previousValues.target)
          ? previousValues.target
          : ""

      return {
        target,
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
    },
    [searchedTaskQueue, compatibleApplications, props.taskqueues, props.computetargets],
  )

  const context = useMemo(
    (): Context => ({
      applications: props.applications,
      targetOptions:
        props.computetargets.length === 0
          ? [{ title: "", description: "No compute targets" }]
          : (props.computetargets.map((target) => ({
              value: target.metadata.name,
              title: target.metadata.name.replace(/^kind-/, ""),
              description: !target.spec.isJaaSWorkerHost
                ? "This target has not yet been enabled"
                : /^kind-/.test(target.metadata.name)
                  ? "Run the workers on this local Kubernetes cluster"
                  : "Run the workers on this cluster",
              isDisabled: !target.spec.isJaaSWorkerHost,
            })) as TileOptions),
    }),
    [JSON.stringify(props.applications), JSON.stringify(props.computetargets)],
  )

  const title = `Create ${workerpool}`
  const steps = [stepTarget, stepConfigure, stepName]

  return (
    <NewResourceWizard<Values, Context>
      kind="workerpools"
      title={title}
      singular={workerpool}
      defaults={defaults}
      yaml={yaml}
      steps={steps}
      context={context}
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
