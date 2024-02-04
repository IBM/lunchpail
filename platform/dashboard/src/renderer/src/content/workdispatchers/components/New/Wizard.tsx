import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, colors } from "unique-names-generator"

import NewResourceWizard from "@jaas/components/NewResourceWizard"

import { singular as workdispatcher } from "@jaas/resources/workdispatchers/name"
import { groupSingular as applicationsSingular } from "@jaas/resources/applications/group"
import { titleSingular as applicationsDefinitionSingular } from "@jaas/resources/applications/title"

import type Values from "./Values"
import type ManagedEvents from "@jaas/resources/ManagedEvent"

import yaml from "./yaml"

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

type Props = Pick<ManagedEvents, "applications">

export default function NewWorkDispatcherWizard(props: Props) {
  const [searchParams] = useSearchParams()

  const namespaceFromSearch = searchParams.get("namespace")
  const taskqueueFromSearch = searchParams.get("taskqueue")
  const applicationFromSearch = searchParams.get("application")
  const nameFromSearch = applicationFromSearch ? applicationFromSearch + "-dispatcher" : undefined

  if (!taskqueueFromSearch) {
    return "Internal Error: taskqueue not provided"
  }

  if (!applicationFromSearch || !namespaceFromSearch || !props.applications) {
    console.error("Application not found (1)", applicationFromSearch, namespaceFromSearch, props.applications)
    return `Internal Error: ${applicationsDefinitionSingular} not found: ${
      applicationFromSearch || "<none>"
    } in namespace ${namespaceFromSearch || "<none>"}`
  }

  const application = props.applications.find(
    (_) => _.metadata.name === applicationFromSearch && _.metadata.namespace === namespaceFromSearch,
  )
  if (!application) {
    console.error("Application not found (2)", applicationFromSearch, namespaceFromSearch, props.applications)
    return `Internal Error: ${applicationsDefinitionSingular} not found: ${
      applicationFromSearch || "<none>"
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
        description: previousValues?.description ?? "",
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
        context: application.metadata.context,
      }
    },
    [nameFromSearch],
  )

  const getYaml = useCallback(
    (values) => yaml(values, application, taskqueueFromSearch),
    [application, taskqueueFromSearch],
  )

  const action = "register"
  const title = `Start a ${workdispatcher}`
  const steps = [step1, step2, step3]

  return (
    <NewResourceWizard<Values>
      kind="workdispatchers"
      title={title}
      singular={workdispatcher}
      defaults={defaults}
      yaml={getYaml}
      steps={steps}
      action={action}
    >
      This wizard helps you to feed Tasks to a {applicationsSingular}.
    </NewResourceWizard>
  )
}
