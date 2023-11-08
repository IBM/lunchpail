import { datasets, taskqueues } from "./Card"
import DrawerContent from "@jay/components/Drawer/Content"
import DeleteResourceButton from "@jay/components/DeleteResourceButton"
import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"

import { singular } from "../name"
import Yaml from "@jay/components/YamlFromObject"
import { yamlFromSpec } from "./New/yaml"
import LinkToNewWizard from "@jay/renderer/navigate/wizard"

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
  return Object.entries(props.application.spec)
    .filter(([, value]) => value)
    .flatMap(([term, value]) =>
      term === "repo"
        ? descriptionGroup("Source", repoPlusSource(props))
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
  return <LinkToNewWizard startOrAdd="edit" kind="applications" linkText="Edit" qs={qs} />
}

/** Button/Action: Clone this resource */
function Clone(props: Props) {
  const qs = [
    `name=${props.application.metadata.name + "-copy"}`,
    `yaml=${encodeURIComponent(JSON.stringify(props.application))}`,
  ]
  return <LinkToNewWizard startOrAdd="clone" kind="applications" linkText="Clone" qs={qs} />
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
      actions={props && [<Edit {...props} />, <Clone {...props} />]}
      rightActions={props && [deleteAction(props)]}
    />
  )
}
