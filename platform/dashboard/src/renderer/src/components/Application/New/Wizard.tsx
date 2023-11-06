import { useCallback } from "react"
import { type FormContextProps } from "@patternfly/react-core"
import { useLocation, useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, animals } from "unique-names-generator"

import yaml, { type YamlProps } from "./yaml"
import names, { singular } from "../../../names"
import NewResourceWizard from "../../NewResourceWizard"
import { buttonPropsForNewDataSet } from "../../../navigate/newdataset"
import { Checkbox, Input, Select, SelectCheckbox, TextArea } from "../../Forms"

import type DataSetEvent from "@jay/common/events/DataSetEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

import TaskQueueIcon from "../../TaskQueue/Icon"

type Props = {
  datasets: DataSetEvent[]
}

function repoInput(ctrl: FormContextProps) {
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

function image(ctrl: FormContextProps) {
  return <Input fieldId="image" label="Image" description="The base image to run your code on" ctrl={ctrl} />
}

function command(ctrl: FormContextProps) {
  return (
    <Input
      fieldId="command"
      label="Command line"
      description={`The command line used to launch your ${singular.applications}`}
      ctrl={ctrl}
    />
  )
}

function supportsGpu(ctrl: FormContextProps) {
  return (
    <Checkbox
      fieldId="supportsGpu"
      label="Supports GPU?"
      description={`Does your ${singular.applications} support execution on GPUs?`}
      ctrl={ctrl}
      isRequired={false}
    />
  )
}

const step1 = {
  name: "Name",
  isValid: (ctrl: FormContextProps) => !!ctrl.values.name && !!ctrl.values.namespace && !!ctrl.values.description,
  items: ["name" as const, "namespace" as const, "description" as const],
}

const step2 = {
  name: "Code and Dependencies",
  isValid: (ctrl: FormContextProps) => !!ctrl.values.repo && !!ctrl.values.image && !!ctrl.values.command,
  items: [command, repoInput, image, supportsGpu],
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

      return {
        name:
          rsrc?.metadata.name ??
          previousValues?.name ??
          uniqueNamesGenerator({ dictionaries: [animals], seed: 1696170097365 + Date.now() }),
        namespace: rsrc?.metadata?.name ?? searchParams.get("namespace") ?? previousValues?.namespace ?? "default",
        repo: rsrc?.spec?.repo ?? previousValues?.repo ?? "",
        image:
          rsrc?.spec?.image ??
          previousValues?.image ??
          "ghcr.io/project-codeflare/codeflare-workerpool-worker-alpine-component:dev",
        command: rsrc?.spec?.command ?? previousValues?.command ?? "",
        description: rsrc?.spec?.description ?? previousValues?.description ?? "",
        supportsGpu: rsrc?.spec?.supportsGpu.toString() ?? previousValues?.supportsGpu ?? "false",
        useTestQueue: previousValues?.useTestQueue ?? "true",
        datasets: previousValues?.datasets ?? "",
        inputFormat: previousValues?.inputFormat ?? "",
        inputSchema: previousValues?.inputSchema ?? "",
      }
    },
    [searchParams],
  )

  const datasets = useCallback(
    (ctrl: FormContextProps) => (
      <SelectCheckbox
        fieldId="datasets"
        label={names.datasets}
        description={`Select the "fixed" ${names.datasets} this ${singular.applications} needs access to`}
        ctrl={ctrl}
        options={props.datasets.map((_) => _.metadata.name).sort()}
        icons={<TaskQueueIcon />}
      />
    ),
    [],
  )

  /*const useTestQueueCheckbox = useCallback(
    (ctrl: FormContextProps) => (
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
  const registerDataset = (ctrl: FormContextProps) =>
    buttonPropsForNewDataSet({ location, searchParams }, { action: "register", namespace: ctrl.values.namespace })

  const step3 = {
    name: names.datasets,
    alerts: [
      {
        title: names.datasets,
        body: (
          <span>
            If your {singular.applications} needs access to one or more {names.datasets}, i.e. global data needed across
            all tasks (e.g. a pre-trained model or a chip design that is being tested across multiple configurations),
            you may supply that information here.
          </span>
        ),
      },
      ...(props.datasets.length > 0
        ? []
        : [
            {
              variant: "warning" as const,
              title: "Warning",
              body: <span>No {names.datasets} are registered</span>,
              actionLinks: [registerDataset],
            },
          ]),
    ],
    items: props.datasets.length === 0 ? [] : [datasets],
  }

  const step4 = {
    name: "Automated Testing",
    items: [
      (ctrl: FormContextProps) => (
        <Select
          fieldId="inputFormat"
          label="Input Format"
          description={`Choose the file format that your ${singular.applications} accpets`}
          ctrl={ctrl}
          options={[
            {
              value: "Parquet",
              description:
                "Apache Parquet is an open source, column-oriented data file format designed for efficient data storage and retrieval. It provides efficient data compression and encoding schemes with enhanced performance to handle complex data in bulk.",
            },
          ]}
        />
      ),

      (ctrl: FormContextProps) => (
        <TextArea
          fieldId="inputSchema"
          label="Input Schema"
          description={`The JSON schema of the Tasks accepted by your ${singular.applications}`}
          ctrl={ctrl}
          rows={12}
        />
      ),
    ],
  }

  /*const step4 = {
    name: singular.taskqueues,
    alerts: [
      {
        title: `Link to a ${singular.taskqueues}`,
        body: (
          <span>
            Your {singular.applications} should register itself as a <strong>consumer</strong> of tasks from a{" "}
            <strong>{singular.taskqueues}</strong>.
          </span>
        ),
      },
    ],
    items: [useTestQueueCheckbox],
  }*/

  const isEdit = searchParams.has("yaml")
  const title = `${isEdit ? "Edit" : "Register"} ${singular.applications}`
  const steps = [step1, step2, step3, step4]

  const getYaml = useCallback((values: Record<string, string>) => yaml(values as unknown as YamlProps), [])

  return (
    <NewResourceWizard
      kind="applications"
      title={title}
      defaults={defaults}
      yaml={getYaml}
      steps={steps}
      isEdit={isEdit}
    >
      An {singular.applications} is the source code that knows how to consume and then process <strong>Tasks</strong>.
      Once you have registered your {singular.applications}, you can bring online <strong>{names.workerpools}</strong>{" "}
      that run the {singular.applications} against the tasks in a <strong>{singular.taskqueues}</strong>.
    </NewResourceWizard>
  )
}
