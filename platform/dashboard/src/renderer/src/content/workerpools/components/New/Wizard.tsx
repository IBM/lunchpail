import { useCallback, useMemo } from "react"
import removeAccents from "remove-accents"
import { useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, starWars } from "unique-names-generator"

import NewResourceWizard from "@jaas/components/NewResourceWizard"

import { name as computetargets } from "@jaas/resources/computetargets/name"
import { singular as workerpool } from "@jaas/resources/workerpools/name"
import { groupSingular as application } from "@jaas/resources/applications/group"

import type { TileOptions } from "@jaas/components/Forms/Tiles"

import type Props from "./Props"
import type Values from "./Values"
import type Context from "./Context"

import yaml from "./yaml"

import stepName from "./steps/name"
import stepTarget from "./steps/target"
import stepConfigure from "./steps/configure"

export default function NewWorkerPoolWizard(props: Props) {
  const [searchParams] = useSearchParams()

  /** Try to associate with a Task Queue? */
  const searchedTaskQueue = chooseIfExistsByName(props.taskqueues, searchParams.get("taskqueue"))

  /** Try to associate with an Run? */
  const searchedRun = chooseIfExists(props.runs, searchParams.get("run"))

  /** If we are trying to associate with a particular Task Queue, then filter Runs list down to those compatible with it */
  const compatibleRuns = useMemo(() => (searchedRun ? [searchedRun] : props.runs), [props.runs])

  /** Initial value for form */
  const defaults = useCallback(
    (previousValues?: Values["values"]) => {
      // make sure the previous selection is still a valid one
      const context =
        previousValues?.context && props.computetargets.find((_) => _.metadata.name === previousValues.context)
          ? previousValues.context
          : ""

      return {
        context,
        name:
          (searchedRun ? searchedRun.metadata.name + "-" : "") +
          removeAccents(
            uniqueNamesGenerator({ dictionaries: [starWars], length: 1, style: "lowerCase" }).replace(/\s/g, "-"),
          ),
        count: String(1),
        size: "xs",
        supportsGpu: false.toString(),
        run: chooseIfSingleton(compatibleRuns),
        taskqueue:
          props.taskqueues.length === 1
            ? props.taskqueues[0].metadata.name
            : chooseIfExistsByName(props.taskqueues, searchedTaskQueue),
      }
    },
    [searchedTaskQueue, compatibleRuns, props.taskqueues, props.computetargets],
  )

  const context = useMemo(
    (): Context => ({
      runs: props.runs,
      computetargets: props.computetargets,
      targetOptions:
        props.computetargets.length === 0
          ? [{ title: "", description: `No ${computetargets}` }]
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
    [JSON.stringify(props.runs), JSON.stringify(props.computetargets)],
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
function chooseIfSingleton(A: import("@jaas/common/events/KubernetesResource").default[]): string {
  return A.length === 1 ? A[0].metadata.name : ""
}

/** If the user desires to associate this Worker Pool with a given `desired` Task Queue, make sure it exists */
function chooseIfExists<R extends import("@jaas/common/events/KubernetesResource").default>(
  available: R[],
  desired: null | string,
): R | undefined {
  return available.find((_) => _.metadata.name === desired)
}

/** If the user desires to associate this Worker Pool with a given `desired` Task Queue, make sure it exists */
function chooseIfExistsByName<R extends import("@jaas/common/events/KubernetesResource").default>(
  available: R[],
  desired: null | string,
): string {
  const rsrc = chooseIfExists(available, desired)
  return !rsrc ? "" : rsrc.metadata.name
}
