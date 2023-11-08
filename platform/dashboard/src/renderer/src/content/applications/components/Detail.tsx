import { Text } from "@patternfly/react-core"

import Yaml from "@jay/components/YamlFromObject"
import DrawerContent from "@jay/components/Drawer/Content"
import LinkToNewWizard from "@jay/renderer/navigate/wizard"
import DeleteResourceButton from "@jay/components/DeleteResourceButton"
import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"

import { singular } from "../name"
import { yamlFromSpec } from "./New/yaml"
import { api, datasets, taskqueues } from "./Card"

import type Props from "./Props"

/**
 * If we can find a "foo.py", then append it to the repo, so that
 * users can click to see the source directly.
 */
function repoPlusSource(props: Props) {
  const source = props.application.spec.command.match(/\s(\w+\.py)\s/)
  return props.application.spec.repo + (source ? "/" + source[1] : "")
}

/** The DescriptionList groups to show in this Detail view */
function detailGroups(props: Props) {
  const { spec } = props.application

  return [
    ...api(props),
    descriptionGroup("description", spec.description),
    taskqueues(props),
    datasets(props),
    descriptionGroup("command", <Text component="pre">{spec.command}</Text>),
    descriptionGroup("image", spec.image),
    descriptionGroup("repo", repoPlusSource(props)),
    descriptionGroup("Supports Gpu?", spec.supportsGpu),
  ]
  return Object.entries(props.application.spec)
    .filter(([key, value]) => !!value && key !== "api" && value !== "workqueue")
    .sort((a, b) => (a[0] === "description" ? -1 : b[1] === "description" ? 1 : a[0].localeCompare(b[0])))
    .flatMap(([term, value]) =>
      term === "repo"
        ? descriptionGroup(term, repoPlusSource(props))
        : term === "inputs"
        ? [taskqueues(props), datasets(props)]
        : typeof value !== "function" && typeof value !== "object" && descriptionGroup(term, value),
    )
}

/** Button/Action: Delete this resource */
function deleteAction(props: Props) {
  return (
    <DeleteResourceButton
      singular={singular}
      kind="applications.codeflare.dev"
      yaml={yamlFromSpec(props.application)}
      name={props.application.metadata.name}
      namespace={props.application.metadata.namespace}
    />
  )
}

/** Button/Action: Edit this resource */
function Edit(props: Props) {
  const qs = [`yaml=${encodeURIComponent(JSON.stringify(props.application))}`]
  return <LinkToNewWizard key="edit" startOrAdd="edit" kind="applications" linkText="Edit" qs={qs} />
}

/** Button/Action: Clone this resource */
function Clone(props: Props) {
  const qs = [
    `name=${props.application.metadata.name + "-copy"}`,
    `yaml=${encodeURIComponent(JSON.stringify(props.application))}`,
  ]
  return <LinkToNewWizard key="clone" startOrAdd="clone" kind="applications" linkText="Clone" qs={qs} />
}

export default function ApplicationDetail(props: Props) {
  const { inputs } = props.application.spec
  const otherTabs =
    inputs && inputs.length > 0 && typeof inputs[0].schema === "object"
      ? [
          {
            title: "Task Schema",
            body: <Yaml showLineNumbers={false} obj={JSON.parse(inputs[0].schema.json)} />,
            hasNoPadding: true,
          },
        ]
      : undefined

  return (
    <DrawerContent
      summary={props && <DescriptionList groups={detailGroups(props)} />}
      raw={props.application}
      otherTabs={otherTabs}
      actions={props && [Edit(props), Clone(props)]}
      rightActions={props && [deleteAction(props)]}
    />
  )
}
