import { useSearchParams } from "react-router-dom"
import { useCallback, useMemo } from "react"
import { uniqueNamesGenerator, colors } from "unique-names-generator"

import NewResourceWizard from "@jaas/components/NewResourceWizard"

import { singular as runSingular } from "@jaas/resources/runs/name"
import { singular as workdispatcher } from "@jaas/resources/workdispatchers/name"

import type Values from "./Values"
import type Context from "./Context"
import type ManagedEvents from "@jaas/resources/ManagedEvent"

import yaml from "./yaml"
import { contextFor } from "./Context"

import method from "./methods"
import step2 from "./methods/configure"

const step1 = {
  name: "Select a dispatch method",
  isValid: (ctrl: Values) => !!ctrl.values.method,
  items: [method],
}

const step3 = {
  name: "Name your " + workdispatcher,
  isValid: (ctrl: Values) => !!ctrl.values.name && !!ctrl.values.namespace && !!ctrl.values.description,
  items: ["name" as const, "namespace" as const, "description" as const],
}

export type Props = Pick<ManagedEvents, "runs" | "applications">

export default function NewWorkDispatcherWizard(props: Props) {
  const [searchParams] = useSearchParams()

  const namespaceFromSearch = searchParams.get("namespace")
  const runFromSearch = searchParams.get("run")
  const nameFromSearch = runFromSearch ? runFromSearch + "-dispatcher" : undefined

  if (!runFromSearch || !namespaceFromSearch || !props.runs) {
    console.error("Run not found (1)", runFromSearch, namespaceFromSearch, props.runs)
    return `Internal Error: ${runSingular} not found: ${
      runFromSearch || "<none>"
    } in namespace ${namespaceFromSearch || "<none>"}`
  }

  const run = props.runs.find((_) => _.metadata.name === runFromSearch && _.metadata.namespace === namespaceFromSearch)
  if (!run) {
    console.error("Run not found (2)", runFromSearch, namespaceFromSearch, props.runs)
    return `Internal Error: ${runSingular} not found: ${
      runFromSearch || "<none>"
    } in namespace ${namespaceFromSearch || "<none>"}`
  }

  /** Initial value for form */
  const defaults = useCallback(
    (previousValues?: Values["values"]): Values["values"] => {
      return {
        name:
          nameFromSearch ??
          previousValues?.name ??
          uniqueNamesGenerator({ dictionaries: [colors], seed: 1696170097365 + Date.now() }),
        namespace: namespaceFromSearch ?? previousValues?.namespace ?? "",
        application: previousValues?.application ?? "",
        description: previousValues?.description ?? `Describe your ${workdispatcher}`,
        method: previousValues?.method ?? "tasksimulator",
        tasks: previousValues?.tasks ?? "1",
        intervalSeconds: previousValues?.intervalSeconds ?? "5",
        inputFormat: previousValues?.inputFormat ?? "",
        inputSchema: previousValues?.inputSchema ?? "",
        min: previousValues?.min ?? "1",
        max: previousValues?.max ?? "5",
        step: previousValues?.step ?? "1",
        repo: previousValues?.repo ?? "",
        values: previousValues?.values ?? "",
        context: run.metadata.context,
      }
    },
    [nameFromSearch],
  )

  const getYaml = useCallback((values) => yaml(values, run), [run])

  const action = "register"
  const title = `New ${workdispatcher}${runFromSearch ? ` for ${runFromSearch}` : ""}`
  const steps = [step1, step2, step3]

  const context: Context = useMemo(() => contextFor(props), [props.applications])

  return (
    <NewResourceWizard<Values, Context>
      kind="workdispatchers"
      title={title}
      singular={workdispatcher}
      defaults={defaults}
      yaml={getYaml}
      steps={steps}
      action={action}
      context={context}
    >
      This wizard helps you to feed Tasks to a {runSingular}.
    </NewResourceWizard>
  )
}
