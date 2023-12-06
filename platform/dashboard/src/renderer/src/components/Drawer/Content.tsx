import { type ReactNode, type ReactElement } from "react"
import { Divider, DrawerPanelBody, Tabs, type Tab } from "@patternfly/react-core"

import Yaml from "../YamlFromObject"
import DrawerToolbar from "./Toolbar"
import DetailNotFound from "../DetailNotFound"

import type KubernetesResource from "@jay/common/events/KubernetesResource"

import DrawerTab from "./Tab"
type TabsProps = {
  summary?: ReactNode
  raw?: KubernetesResource | null
  defaultActiveKey?: string
  otherTabs?: ReactElement<typeof Tab>[]
}

type Props = TabsProps & {
  /** Actions to be displayed left-justified */
  actions?: ReactElement[]

  /** Actions to be displayed right-justified */
  rightActions?: ReactElement[]

  /** Override default initial tab */
  defaultActiveKey?: string
}

/**
 * Content to be shown inside the "sidebar" drawer.
 * |--------------------------|
 * | DrawerPanelBody          |
 * |   Tab1 Tab2 TabT3        |
 * |   Content1               |
 * |                          |
 * | actions     rightActions |
 * |--------------------------|
 */
export default function DrawerContent(props: Props) {
  return (
    <>
      <DrawerPanelBody className="codeflare--detail-view-body" hasNoPadding>
        <TabbedContent
          summary={props.summary}
          raw={props.raw}
          otherTabs={props.otherTabs}
          defaultActiveKey={props.defaultActiveKey}
        />
      </DrawerPanelBody>

      {((props.actions && props.actions?.length > 0) || (props.rightActions && props.rightActions?.length > 0)) && (
        <>
          <Divider />
          <DrawerPanelBody hasNoPadding className="codeflare--detail-view-footer">
            <DrawerToolbar actions={props.actions} rightActions={props.rightActions} />
          </DrawerPanelBody>
        </>
      )}
    </>
  )
}

/**
 * The Tabs and Body parts of `DrawerContent`
 */
function TabbedContent(props: TabsProps) {
  const tabs = [
    ...(!props.summary ? [] : [DrawerTab({ title: "Summary", body: props.summary || <DetailNotFound /> })]),
    ...(props.otherTabs || []),
    ...(!props.raw ? [] : [DrawerTab({ title: "YAML", body: <Yaml obj={props.raw} readOnly />, hasNoPadding: true })]),
  ]

  return (
    <Tabs defaultActiveKey={props.defaultActiveKey ?? "Summary"} mountOnEnter isFilled>
      {tabs}
    </Tabs>
  )
}
