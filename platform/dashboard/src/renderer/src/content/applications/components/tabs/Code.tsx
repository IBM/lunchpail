import { Text } from "@patternfly/react-core"

import Code from "@jaas/components/Code"
import DrawerTab from "@jaas/components/Drawer/Tab"
import { dl as DescriptionList, descriptionGroup } from "@jaas/components/DescriptionGroup"

import api from "../api"
import type Props from "../Props"
import { codeLanguageFromCommand } from "../New/yaml"

export default function codeTab(props: Props) {
  // here, we show a no-padding <Code/> body for Applications that
  // have code-by-literal (i.e. inlined into the Application yaml);
  // otherwise, we have to use a DescriptionList to spell out the
  // repo, detaeils etc.
  return DrawerTab({
    title: "Code",
    hasNoPadding: !!props.application.spec.code,
    body: props.application.spec.code ? (
      code(props.application.spec.command, props.application.spec.code)
    ) : (
      <DescriptionList groups={groups(props)} />
    ),
  })
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

/** If the Application has code inlined into the yaml spec */
function code(
  command: Props["application"]["spec"]["command"],
  code: NonNullable<Props["application"]["spec"]["code"]>,
) {
  return (
    <Code readOnly language={codeLanguageFromCommand(command)}>
      {code}
    </Code>
  )
}

/** Code form literal directly in yaml */
function fromLiteralGroups(props: Props) {
  const { spec } = props.application

  return !spec.code ? [] : [descriptionGroup("source", code(spec.command, spec.code))]
}

/** The DescriptionList groups to show in this Tab */
function groups(props: Props) {
  const { spec } = props.application

  return [
    ...api(props),
    ...fromRepoGroups(props),
    ...fromLiteralGroups(props),
    descriptionGroup("Supports Gpu?", spec.supportsGpu),
  ]
}
