import { Text } from "@patternfly/react-core"

import DrawerTab from "@jay/components/Drawer/Tab"
import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"

import { api } from "../common"
import type Props from "../Props"

export default function codeTab(props: Props) {
  return DrawerTab({ title: "Code", body: <DescriptionList groups={groups(props)} /> })
}

/**
 * If we can find a "foo.py", then append it to the repo, so that
 * users can click to see the source directly.
 */
function repoPlusSource(props: Props) {
  const source = props.application.spec.command.match(/\s(\w+\.py)\s/)
  return props.application.spec.repo + (source ? "/" + source[1] : "")
}

/** The DescriptionList groups to show in this Tab */
function groups(props: Props) {
  const { spec } = props.application

  return [
    ...api(props),
    descriptionGroup("description", spec.description),
    descriptionGroup("command", <Text component="pre">{spec.command}</Text>),
    descriptionGroup("image", spec.image),
    descriptionGroup("repo", repoPlusSource(props)),
    descriptionGroup("Supports Gpu?", spec.supportsGpu),
  ]
}
