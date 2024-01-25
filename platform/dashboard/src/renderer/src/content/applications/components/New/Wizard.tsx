import { useCallback } from "react"
import { useLocation, useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, animals } from "unique-names-generator"

import yaml, { codeLanguageFromMaybeCommand, type Method, type YamlProps } from "./yaml"
import { buttonPropsForNewDataSet } from "@jaas/renderer/navigate/newdataset"
import NewResourceWizard, { type DefaultValues } from "@jaas/components/NewResourceWizard"

import Input from "@jaas/components/Forms/Input"
import TextArea from "@jaas/components/Forms/TextArea"
import Checkbox from "@jaas/components/Forms/Checkbox"
import SelectCheckbox from "@jaas/components/Forms/SelectCheckbox"
import Tiles, { type TileOptions } from "@jaas/components/Forms/Tiles"

import { groupSingular as job } from "@jaas/resources/applications/group"
import { name as workerpoolsName } from "@jaas/resources/workerpools/name"
import { singular as taskqueuesSingular } from "@jaas/resources/taskqueues/name"
import { titleSingular as application } from "@jaas/resources/applications/title"
import { name as datasetsName, singular as dataset } from "@jaas/resources/datasets/name"

import type DataSetEvent from "@jaas/common/events/DataSetEvent"
import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"

import defaultExampleLiteralCode from "./defaultExampleLiteralCode"

import TaskQueueIcon from "@jaas/resources/taskqueues/components/Icon"
import CodeIcon from "@patternfly/react-icons/dist/esm/icons/code-icon"
import GitHubIcon from "@patternfly/react-icons/dist/esm/icons/github-icon"

type Values = DefaultValues<YamlProps>

type Props = {
  datasets: DataSetEvent[]
}

const methods: TileOptions = [
  {
    value: "github",
    icon: <GitHubIcon />,
    title: "GitHub",
    description: "Pull your source code from a GitHub repository",
  },
  {
    value: "literal",
    icon: <CodeIcon />,
    title: "Paste in Source",
    description: "Copy-paste your source code into this wizard",
  },
]

/** Method of specifying code */
function method(ctrl: Values) {
  return (
    <Tiles
      fieldId="method"
      label="Code Origin"
      description={`How do you wish to provide the code for your ${application}?`}
      ctrl={ctrl}
      options={methods}
    />
  )
}

const stepMethod = {
  name: "Choose how to inject your code",
  isValid: (ctrl: Values) => !!ctrl.values.method,
  items: [method],
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
      description={`The command line used to launch your ${application}`}
      ctrl={ctrl}
    />
  )
}

function supportsGpu(ctrl: Values) {
  return (
    <Checkbox
      fieldId="supportsGpu"
      label="Supports GPU?"
      description={`Does your ${application} support execution on GPUs?`}
      ctrl={ctrl}
      isRequired={false}
    />
  )
}

const stepName = {
  name: "Name your " + application,
  isValid: (ctrl: Values) => !!ctrl.values.name && !!ctrl.values.namespace && !!ctrl.values.description,
  items: ["name" as const, "description" as const],
}

const languages: TileOptions = [
  { value: "python", title: "Python", description: "Run the given code via Python" },
  { value: "shell", title: "Shell Script", description: "Run the given code as a shell script" },
]

function codeLanguage(ctrl: Values) {
  return <Tiles fieldId="codeLanguage" label="Source Language" ctrl={ctrl} options={languages} />
}

function codeLiteral(ctrl: Values) {
  return (
    <TextArea
      fieldId="code"
      label="Source Code"
      description="Paste in your source code here"
      ctrl={ctrl}
      rows={12}
      showLineNumbers
      language={ctrl.values.codeLanguage}
      value={ctrl.values.code || defaultExampleLiteralCode[ctrl.values.codeLanguage]}
    />
  )
}

const stepCode = {
  name: "Provide your code",
  isValid: (ctrl: Values) =>
    ctrl.values.method === "github"
      ? !!ctrl.values.repo && !!ctrl.values.image && !!ctrl.values.command
      : !!ctrl.values.code,
  items: ({ values }: Values) =>
    values.method === "github" ? [command, repoInput, image, supportsGpu] : [codeLanguage, image, codeLiteral],
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
    (previousValues?: Values["values"]) => {
      // are we editing an existing resource `rsrc`? if so, populate
      // the form defaults from its values
      const yaml = searchParams.get("yaml")
      const rsrc = yaml ? (JSON.parse(decodeURIComponent(yaml)) as ApplicationSpecEvent) : undefined

      // have we been asked to suggest a particular name?
      const suggestedName = searchParams.get("name")

      // source via github or code literal?
      const method = (previousValues?.method as Method) ?? ("github" as const)

      const codeLanguage =
        codeLanguageFromMaybeCommand(rsrc?.spec?.command) ?? previousValues?.codeLanguage ?? ("python" as const)

      return {
        name:
          suggestedName ??
          rsrc?.metadata.name ??
          previousValues?.name ??
          uniqueNamesGenerator({ dictionaries: [animals], seed: 1696170097365 + Date.now() }),
        namespace: rsrc?.metadata?.namespace ?? searchParams.get("namespace") ?? previousValues?.namespace ?? "default",
        method,
        repo: rsrc?.spec?.repo ?? previousValues?.repo ?? "",
        code: rsrc?.spec?.code ?? previousValues?.code ?? "",
        codeLanguage,
        image:
          rsrc?.spec?.image ||
          previousValues?.image ||
          (method === "literal"
            ? defaultImageForCodeLiteralLanguage(codeLanguage)
            : "ghcr.io/project-codeflare/codeflare-workerpool-worker-alpine-component:dev"),
        command: rsrc?.spec?.command ?? previousValues?.command ?? "",
        description: rsrc?.spec?.description ?? previousValues?.description ?? "",
        supportsGpu: rsrc?.spec?.supportsGpu.toString() ?? previousValues?.supportsGpu ?? "false",
        datasets: filterPreviousDatasetSelectionToInluceOnlyThoseCurrentlyValid(props, previousValues?.datasets),
      }
    },
    [searchParams],
  )

  const defaultImageForCodeLiteralLanguage = (language: string) =>
    language === "python"
      ? "ghcr.io/project-codeflare/codeflare-workerpool-worker-alpine-python-component:dev"
      : "ghcr.io/project-codeflare/codeflare-workerpool-worker-alpine-component:dev"

  /**
   * If the user changes the codeLanguage, then invalidate
   * `code`. This is so that when switching between `codeLanguage`,
   * the user will see the different default code literals.
   */
  const onChange = useCallback(
    (fieldId: string, newValue: string, values: Values["values"], setValue: Values["setValue"] | undefined) => {
      if (fieldId === "codeLanguage" && setValue) {
        setValue("code", "")

        const selectedImageForPreviousLanguage = values.image
        const defaultImageForPreviousLanguage = defaultImageForCodeLiteralLanguage(values.codeLanguage)
        if (selectedImageForPreviousLanguage === defaultImageForPreviousLanguage) {
          const defaultImageForNewLanguage = defaultImageForCodeLiteralLanguage(newValue)
          setValue("image", defaultImageForNewLanguage)
        }
      }
    },
    [],
  )

  const datasets = useCallback(
    (ctrl: Values) => (
      <SelectCheckbox
        fieldId="datasets"
        label={datasetsName}
        description={`Select the "fixed" ${datasetsName} this ${application} needs access to`}
        ctrl={ctrl}
        options={props.datasets.map((_) => _.metadata.name).sort()}
        icons={<TaskQueueIcon />}
      />
    ),
    [],
  )

  const location = useLocation()
  const registerDataset = (ctrl: Values) =>
    buttonPropsForNewDataSet({ location, searchParams }, { action: "register", namespace: ctrl.values.namespace })

  const stepData = {
    name: "Optionally bind a " + dataset + " to your " + job,
    alerts: [
      {
        title: datasetsName,
        body: (
          <>
            If your {application} needs access to one or more <strong>{dataset}</strong> to store global data needed by
            all <strong>Tasks</strong> (e.g. a pre-trained model or a chip design that is being tested across multiple
            configurations), you may supply that information here.
          </>
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
  const title = `${action === "edit" ? "Edit" : action === "clone" ? "Clone" : "Register"} ${application}`
  const steps = [stepMethod, stepCode, stepData, stepName]

  return (
    <NewResourceWizard<Values>
      kind="applications"
      title={title}
      singular={application}
      defaults={defaults}
      yaml={yaml}
      steps={steps}
      action={action}
      onChange={onChange}
    >
      This wizard helps you to register the {application} that knows how to consume and then process{" "}
      <strong>Tasks</strong>. Once you have registered your {application}, you can bring online{" "}
      <strong>{workerpoolsName}</strong> that run the {application} against the tasks in a{" "}
      <strong>{taskqueuesSingular}</strong>.
    </NewResourceWizard>
  )
}
