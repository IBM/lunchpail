import { type ReactNode } from "react"
import { DrawerPanelBody, Tab, TabTitleIcon, TabTitleText } from "@patternfly/react-core"

export type DrawerTabProps = {
  title: string
  icon?: ReactNode
  body: ReactNode
  hasNoPadding?: boolean
  actions?: ReactNode
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
      actions={tab.actions}
    >
      <DrawerPanelBody hasNoPadding={tab.hasNoPadding}>{tab.body}</DrawerPanelBody>
    </Tab>
  )
}
