import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, colors } from "unique-names-generator"

import NumberInput from "@jay/components/Forms/NumberInput"
import Tiles, { type TileOptions } from "@jay/components/Forms/Tiles"
import NewResourceWizard, { type DefaultValues } from "@jay/components/NewResourceWizard"

import { singular } from "../../name"
import { groupSingular as applicationsSingular } from "../../../applications/group"
import { titleSingular as applicationsDefinitionSingular } from "../../../applications/title"

import type ManagedEvents from "../../../ManagedEvent"

import yaml from "./yaml"

import HelmIcon from "@patternfly/react-icons/dist/esm/icons/hard-hat-icon" // FIXME
import WandIcon from "@patternfly/react-icons/dist/esm/icons/magic-icon"
import BucketIcon from "@patternfly/react-icons/dist/esm/icons/folder-icon" // FIXME

type Method = "tasksimulator" | "bucket" | "helm"

export type Values = DefaultValues<
  { method: Method; tasks: string; intervalSeconds: string } & { name: string; namespace: string; description: string }
>

const step2 = {
  name: "Name",
  isValid: (ctrl: Values) => !!ctrl.values.name && !!ctrl.values.namespace && !!ctrl.values.description,
  items: ["name" as const, "namespace" as const, "description" as const],
}

/** Available methods for injecting Tasks */
const methods: TileOptions = [
  {
    value: "tasksimulator",
    icon: <WandIcon />,
    title: "Task Simulator",
    description: `Periodically inject valid auto-generated Tasks. This can help with testing. This requires that your ${applicationsDefinitionSingular} has included a Task Schema.`,
  },
  {
    value: "bucket",
    icon: <BucketIcon />,
    title: "S3 Bucket",
    description: "Pull Tasks from a given S3 bucket.",
    isDisabled: true,
  },
  {
    value: "helm",
    icon: <HelmIcon />,
    title: "Helm Chart",
    description: "Launch a Kubernetes workload that will inject Tasks.",
    isDisabled: true,
  },
]

/** Method of injecting Tasks? */
function method(ctrl: Values) {
  return (
    <Tiles
      fieldId="method"
      label="Method of Task Injection"
      description={`How do you wish to provide Tasks to your ${applicationsSingular}?`}
      ctrl={ctrl}
      options={methods}
    />
  )
}

const step1 = {
  name: "Dispatch Method",
  isValid: (ctrl: Values) => !!ctrl.values.method,
  items: [method],
}

const nTasks = (ctrl: Values) => (
  <NumberInput
    fieldId="tasks"
    label="Number of Tasks"
    description="Every interval, the simulator will inject this many Tasks"
    min={1}
    defaultValue={parseInt(ctrl.values.tasks, 10)}
    ctrl={ctrl}
  />
)
const injectionInterval = (ctrl: Values) => (
  <NumberInput
    fieldId="intervalSeconds"
    label="Injection Interval"
    labelInfo="Specified in seconds"
    description="The interval between Task injections"
    min={1}
    defaultValue={parseInt(ctrl.values.intervalSeconds, 10)}
    ctrl={ctrl}
  />
)

const step3TaskSimulatorItems = [nTasks, injectionInterval]

const step3 = {
  name: "Configure",
  gridSpans: 5 as const,
  items: (values: Values["values"]) => (values.method === "tasksimulator" ? step3TaskSimulatorItems : []),
  alerts: [
    {
      title: "Configure this " + singular,
      body: "Your choice of " + singular + " offers the following configuration parameters.",
    },
  ],
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
    (previousValues?: Values["values"]) => {
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
      }
    },
    [nameFromSearch],
  )

  const getYaml = useCallback(
    (values) => yaml(values, application, taskqueueFromSearch),
    [application, taskqueueFromSearch],
  )

  const action = "register"
  const title = `Start ${singular}`
  const steps = [step1, step2, step3]

  return (
    <NewResourceWizard<Values>
      kind="workdispatchers"
      title={title}
      singular={singular}
      defaults={defaults}
      yaml={getYaml}
      steps={steps}
      action={action}
    >
      This wizard helps you to feed Tasks to a {applicationsSingular}.
    </NewResourceWizard>
  )
}