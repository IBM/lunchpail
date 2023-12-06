import { type ReactNode, type ReactElement } from "react"
import { Divider, DrawerPanelBody, Tabs, type Tab } from "@patternfly/react-core"

import Yaml from "../YamlFromObject"
import DrawerTab from "./Tab"
import DrawerToolbar from "./Toolbar"
import DetailNotFound from "../DetailNotFound"

import type KubernetesResource from "@jay/common/events/KubernetesResource"

/**
 * Properties for a set of Tabs shown in the slide-out Drawer
 */
type TabsProps = {
  /** Content to show in the Summary Tab */
  summary?: ReactNode

  /** Content to show in the YAML Tab */
  raw?: KubernetesResource | null

  /** Id of the default active Tab */
  defaultActiveKey?: string

  /** Other Tab elements that will be shown between Summary and YAML tabs */
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
      {mainBodyPart(props)}
      {footerPart(props)}
    </>
  )
}

/**
 * This includes the non-footer elements of the Drawer panel
 * |--------------------------|
 * | DrawerPanelBody          |
 * |   Tab1 Tab2 TabT3        |
 * |   Content1               |
 * |--------------------------|
 */
function mainBodyPart(props: Props) {
  return (
    <DrawerPanelBody className="codeflare--detail-view-body" hasNoPadding>
      <TabbedContent
        summary={props.summary}
        raw={props.raw}
        otherTabs={props.otherTabs}
        defaultActiveKey={props.defaultActiveKey}
      />
    </DrawerPanelBody>
  )
}

/**
 * This includes the footer elements of the Drawer panel
 * |--------------------------|
 * | actions     rightActions |
 * |--------------------------|
 */
function footerPart(props: Props) {
  return (
    ((props.actions && props.actions?.length > 0) || (props.rightActions && props.rightActions?.length > 0)) && (
      <>
        <Divider />
        <DrawerPanelBody hasNoPadding className="codeflare--detail-view-footer">
          <DrawerToolbar actions={props.actions} rightActions={props.rightActions} />
        </DrawerPanelBody>
      </>
    )
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
