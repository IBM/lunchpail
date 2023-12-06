import { type ReactNode } from "react"
import { Badge, DrawerPanelBody, Tab, TabAction, TabTitleIcon, TabTitleText } from "@patternfly/react-core"

export type DrawerTabProps = {
  title: string
  icon?: ReactNode
  body: ReactNode
  hasNoPadding?: boolean
  count?: number
}

export default function DrawerTab(tab: DrawerTabProps) {
  return (
    <Tab
      key={tab.title}
      ouiaId={tab.title}
      id={`codeflare--drawer-tab-${tab.title}`}
      arial-label={tab.title}
      title={
        <>
          {tab.icon ? <TabTitleIcon>{tab.icon}</TabTitleIcon> : <></>} <TabTitleText>{tab.title}</TabTitleText>
        </>
      }
      eventKey={tab.title}
      actions={
        typeof tab.count === "number" && (
          <TabAction>
            <Badge isRead={tab.count === 0}>{tab.count}</Badge>
          </TabAction>
        )
      }
    >
      <DrawerPanelBody hasNoPadding={tab.hasNoPadding}>{tab.body}</DrawerPanelBody>
    </Tab>
  )
}
