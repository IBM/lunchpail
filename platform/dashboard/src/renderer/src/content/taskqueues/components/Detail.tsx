import { useMemo } from "react"

import DrawerContent from "@jaas/components/Drawer/Content"
import S3BrowserTab from "@jaas/components/S3Browser/DrawerTab"

import summaryTabContent from "./tabs/Summary"

export default function TaskQueueDetail(props: import("./Props").PropsSummary) {
  const otherTabs = useMemo(() => {
    const browserTab = S3BrowserTab(props.taskqueue.spec.local)
    return browserTab ? [browserTab] : []
  }, [props.taskqueue.spec.local])

  return <DrawerContent summary={summaryTabContent(props)} otherTabs={otherTabs} raw={props.taskqueue} />
}
