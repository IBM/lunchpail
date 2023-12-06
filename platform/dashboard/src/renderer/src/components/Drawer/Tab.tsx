import { type ReactNode } from "react"
import { Badge, DrawerPanelBody, Tab, TabAction, TabTitleIcon, TabTitleText, Tooltip } from "@patternfly/react-core"

export type DrawerTabProps = {
  /** Tab title  */
  title: string

  /** Tab icon */
  icon?: ReactNode

  /** Tab body content */
  body: ReactNode

  /** Display `body` flush to container */
  hasNoPadding?: boolean

  /** A count to be displayed alongside in the Tab `title` */
  count?: number

  /** Tooltip to show on hover over the `title` */
  tooltip?: string
}

/** A single Tab to be shown in the slide-out Drawer */
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
      tooltip={tab.tooltip ? <Tooltip content={tab.tooltip} /> : undefined}
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
