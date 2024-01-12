import { type ReactNode, type ReactElement } from "react"
import { Tabs, type TabProps } from "@patternfly/react-core"

import type KubernetesResource from "@jay/common/events/KubernetesResource"

import Yaml from "../YamlFromObject"
import DrawerTab from "./Tab"
import DetailNotFound from "../DetailNotFound"

/**
 * Properties for a set of Tabs shown in the slide-out Drawer
 */
export type Props = {
  /** Content to show in the Summary Tab */
  summary?: ReactNode

  /** Content to show in the YAML Tab */
  raw?: KubernetesResource | null

  /** Id of the default active Tab */
  defaultActiveKey?: string

  /** Other Tab elements that will be shown between Summary and YAML tabs */
  otherTabs?: ReactElement<TabProps>[]
}

/**
 * The Tabs and Body parts of `DrawerContent`
 */
export default function TabbedContent(props: Props) {
  const tabs = [
    ...(!props.summary ? [] : [DrawerTab({ title: "Summary", body: props.summary || <DetailNotFound /> })]),
    ...(props.otherTabs || []),
    ...(!props.raw ? [] : [DrawerTab({ title: "YAML", body: <Yaml obj={props.raw} readOnly />, hasNoPadding: true })]),
  ]

  // which tab should be initially visible
  const defaultActiveKey = props.defaultActiveKey ?? tabs[0].props.eventKey

  // note on key=, see https://github.com/patternfly/patternfly-react/issues/9966
  return (
    <Tabs key={defaultActiveKey} defaultActiveKey={defaultActiveKey} mountOnEnter isFilled>
      {tabs}
    </Tabs>
  )
}
