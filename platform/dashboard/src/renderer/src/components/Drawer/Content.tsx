import { useCallback, useState, type ReactNode, type ReactElement } from "react"
import { Divider, DrawerPanelBody, Tabs, Tab, TabTitleText } from "@patternfly/react-core"

import Yaml from "../YamlFromObject"
import trimJunk from "./trim-junk"
import DrawerToolbar from "./Toolbar"
import DetailNotFound from "./DetailNotFound"

import type KubernetesResource from "@jay/common/events/KubernetesResource"

type TabProps = { title: string; body: ReactNode; hasNoPadding?: boolean }
type TabsProps = { summary: ReactNode; raw?: KubernetesResource | null; otherTabs?: TabProps[] }

type Props = TabsProps & {
  /** Actions to be displayed left-justified */
  actions?: ReactElement[]

  /** Actions to be displayed right-justified */
  rightActions?: ReactElement[]
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
        <TabbedContent summary={props.summary} raw={props.raw} otherTabs={props.otherTabs} />
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
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0)

  const handleTabClick = useCallback(
    (_event, tabIndex: string | number) => {
      setActiveTabKey(tabIndex)
    },
    [setActiveTabKey],
  )

  const tabs: TabProps[] = [
    { title: "Summary", body: props.summary || <DetailNotFound /> },
    ...(props.otherTabs || []),
    ...(!props.raw ? [] : [{ title: "YAML", body: <Yaml obj={trimJunk(props.raw)} />, hasNoPadding: true }]),
  ]

  return (
    <Tabs activeKey={activeTabKey} onSelect={handleTabClick} mountOnEnter>
      {tabs.map((tab, idx) => (
        <Tab key={tab.title} title={<TabTitleText>{tab.title}</TabTitleText>} eventKey={idx}>
          <DrawerPanelBody hasNoPadding={tab.hasNoPadding}>{tab.body}</DrawerPanelBody>
        </Tab>
      ))}
    </Tabs>
  )
}
