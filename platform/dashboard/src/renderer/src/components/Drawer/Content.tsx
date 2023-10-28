import { useCallback, useState, type ReactNode, type ReactElement } from "react"
import { Divider, DrawerPanelBody, Tabs, Tab, TabTitleText } from "@patternfly/react-core"

import Yaml from "../YamlFromObject"
import trimJunk from "./trim-junk"
import DrawerToolbar from "./Toolbar"
import DetailNotFound from "./DetailNotFound"

type TabsProps = { summary: ReactNode; raw?: object | null }

function ContentTabs(props: TabsProps) {
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0)

  const handleTabClick = useCallback((_event, tabIndex: string | number) => {
    setActiveTabKey(tabIndex)
  }, [])

  return (
    <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
      <Tab title={<TabTitleText>Summary</TabTitleText>} eventKey={0}>
        <DrawerPanelBody>{props.summary || <DetailNotFound />}</DrawerPanelBody>
      </Tab>

      {props.raw && (
        <Tab title={<TabTitleText>YAML</TabTitleText>} eventKey={1}>
          <DrawerPanelBody hasNoPadding>
            <Yaml obj={trimJunk(props.raw)} />
          </DrawerPanelBody>
        </Tab>
      )}
    </Tabs>
  )
}

function ContentPanelBody(props: TabsProps) {
  return (
    <DrawerPanelBody className="codeflare--detail-view-body" hasNoPadding>
      <ContentTabs {...props} />
    </DrawerPanelBody>
  )
}

/** Content to be shown inside the "sidebar" drawer */
export default function DrawerContent(
  props: TabsProps & {
    actions?: ReactElement[]
    rightActions?: ReactElement[]
  },
) {
  return (
    <>
      <ContentPanelBody summary={props.summary} raw={props.raw} />

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
