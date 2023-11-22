import { useCallback } from "react"
import { useLocation, useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, animals } from "unique-names-generator"

import yaml, { type YamlProps } from "./yaml"
import { buttonPropsForNewDataSet } from "@jay/renderer/navigate/newdataset"
import NewResourceWizard, { type DefaultValues } from "@jay/components/NewResourceWizard"

import Input from "@jay/components/Forms/Input"
import Checkbox from "@jay/components/Forms/Checkbox"
import SelectCheckbox from "@jay/components/Forms/SelectCheckbox"

import { titleSingular as singular } from "../../title"
import { name as datasetsName } from "../../../datasets/name"
import { name as workerpoolsName } from "../../../workerpools/name"
import { singular as taskqueuesSingular } from "../../../taskqueues/name"

import type DataSetEvent from "@jay/common/events/DataSetEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

import TaskQueueIcon from "../../../taskqueues/components/Icon"

type Values = DefaultValues<YamlProps>

type Props = {
  datasets: DataSetEvent[]
}

function repoInput(ctrl: Values) {
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

function image(ctrl: Values) {
  return <Input fieldId="image" label="Image" description="The base image to run your code on" ctrl={ctrl} />
}

function command(ctrl: Values) {
  return (
    <Input
      fieldId="command"
      label="Command line"
      description={`The command line used to launch your ${singular}`}
      ctrl={ctrl}
    />
  )
}

function supportsGpu(ctrl: Values) {
  return (
    <Checkbox
      fieldId="supportsGpu"
      label="Supports GPU?"
      description={`Does your ${singular} support execution on GPUs?`}
      ctrl={ctrl}
      isRequired={false}
    />
  )
}

const step1 = {
  name: "Name",
  isValid: (ctrl: Values) => !!ctrl.values.name && !!ctrl.values.namespace && !!ctrl.values.description,
  items: ["name" as const, "namespace" as const, "description" as const],
}

const step2 = {
  name: "Code and Dependencies",
  isValid: (ctrl: Values) => !!ctrl.values.repo && !!ctrl.values.image && !!ctrl.values.command,
  items: [command, repoInput, image, supportsGpu],
}

function filterPreviousDatasetSelectionToInluceOnlyThoseCurrentlyValid(props: Props, previous: undefined | string) {
  if (previous) {
    try {
      const previousArr = JSON.parse(previous)
      return JSON.stringify(previousArr.filter((_) => props.datasets.find((dataset) => dataset.metadata.name === _)))
    } catch (err) {
      console.error("Previous dataset selection is invalid", previous)
    }
  }

  return ""
}

export default function NewApplicationWizard(props: Props) {
  const [searchParams] = useSearchParams()

  /** Initial value for form */
  const defaults = useCallback(
    (previousValues?: Record<string, string>) => {
      // are we editing an existing resource `rsrc`? if so, populate
      // the form defaults from its values
      const yaml = searchParams.get("yaml")
      const rsrc = yaml ? (JSON.parse(decodeURIComponent(yaml)) as ApplicationSpecEvent) : undefined

      // have we been asked to suggest a particular name?
      const suggestedName = searchParams.get("name")

      return {
        name:
          suggestedName ??
          rsrc?.metadata.name ??
          previousValues?.name ??
          uniqueNamesGenerator({ dictionaries: [animals], seed: 1696170097365 + Date.now() }),
        namespace: rsrc?.metadata?.namespace ?? searchParams.get("namespace") ?? previousValues?.namespace ?? "default",
        repo: rsrc?.spec?.repo ?? previousValues?.repo ?? "",
        image:
          rsrc?.spec?.image ??
          previousValues?.image ??
          "ghcr.io/project-codeflare/codeflare-workerpool-worker-alpine-component:dev",
        command: rsrc?.spec?.command ?? previousValues?.command ?? "",
        description: rsrc?.spec?.description ?? previousValues?.description ?? "",
        supportsGpu: rsrc?.spec?.supportsGpu.toString() ?? previousValues?.supportsGpu ?? "false",
        useTestQueue: previousValues?.useTestQueue ?? "true",
        datasets: filterPreviousDatasetSelectionToInluceOnlyThoseCurrentlyValid(props, previousValues?.datasets),
      }
    },
    [searchParams],
  )

  const datasets = useCallback(
    (ctrl: Values) => (
      <SelectCheckbox
        fieldId="datasets"
        label={datasetsName}
        description={`Select the "fixed" ${datasetsName} this ${singular} needs access to`}
        ctrl={ctrl}
        options={props.datasets.map((_) => _.metadata.name).sort()}
        icons={<TaskQueueIcon />}
      />
    ),
    [],
  )

  /*const useTestQueueCheckbox = useCallback(
    (ctrl: Values) => (
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
  const registerDataset = (ctrl: Values) =>
    buttonPropsForNewDataSet({ location, searchParams }, { action: "register", namespace: ctrl.values.namespace })

  const step3 = {
    name: datasetsName,
    alerts: [
      {
        title: datasetsName,
        body: (
          <span>
            If your {singular} needs access to one or more {datasetsName}, i.e. global data needed across all tasks
            (e.g. a pre-trained model or a chip design that is being tested across multiple configurations), you may
            supply that information here.
          </span>
        ),
      },
      ...(props.datasets.length > 0
        ? []
        : [
            {
              variant: "warning" as const,
              title: "Warning",
              body: <span>No {datasetsName} are registered</span>,
              actionLinks: [registerDataset],
            },
          ]),
    ],
    items: props.datasets.length === 0 ? [] : [datasets],
  }

  const action =
    searchParams.get("action") === "edit"
      ? ("edit" as const)
      : searchParams.get("action") === "clone"
        ? ("clone" as const)
        : ("register" as const)
  const title = `${action === "edit" ? "Edit" : action === "clone" ? "Clone" : "Register"} ${singular}`
  const steps = [step1, step2, step3]

  return (
    <NewResourceWizard<Values>
      kind="applications"
      title={title}
      singular={singular}
      defaults={defaults}
      yaml={yaml}
      steps={steps}
      action={action}
    >
      This wizard helps you to register the {singular} that knows how to consume and then process <strong>Tasks</strong>
      . Once you have registered your {singular}, you can bring online <strong>{workerpoolsName}</strong> that run the{" "}
      {singular} against the tasks in a <strong>{taskqueuesSingular}</strong>.
    </NewResourceWizard>
  )
}
