import { Text } from "@patternfly/react-core"

import Code from "@jay/components/Code"
import DrawerTab from "@jay/components/Drawer/Tab"
import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"

import { api } from "../common"
import type Props from "../Props"
import { codeLanguageFromCommand } from "../New/yaml"

export default function codeTab(props: Props) {
  return DrawerTab({ title: "Code", body: <DescriptionList groups={groups(props)} /> })
}

/**
 * If we can find a "foo.py", then append it to the repo, so that
 * users can click to see the source directly.
 */
export function repoPlusSource(props: Props) {
  const source = props.application.spec.command.match(/\s(\w+\.py)\s/)
  return props.application.spec.repo + (source ? "/" + source[1] : "")
}

/** Code from git repo */
function fromRepoGroups(props: Props) {
  const { spec } = props.application

  return spec.code
    ? []
    : [
        descriptionGroup("command", <Text component="pre">{spec.command}</Text>),
        descriptionGroup("image", spec.image),
        descriptionGroup("repo", repoPlusSource(props)),
      ]
}

/** Code form literal directly in yaml */
function fromLiteralGroups(props: Props) {
  const { spec } = props.application

  return !spec.code
    ? []
    : [descriptionGroup("source", <Code language={codeLanguageFromCommand(spec.command)}>{spec.code}</Code>)]
}

/** The DescriptionList groups to show in this Tab */
function groups(props: Props) {
  const { spec } = props.application

  return [
    ...api(props),
    descriptionGroup("description", spec.description),
    ...fromRepoGroups(props),
    ...fromLiteralGroups(props),
    descriptionGroup("Supports Gpu?", spec.supportsGpu),
  ]
}
