import { useMemo } from "react"

import DrawerContent from "@jaas/components/Drawer/Content"
import { BrowserTabs } from "@jaas/components/S3Browser"

import summaryTabContent from "./tabs/Summary"

export default function TaskQueueDetail(props: import("./Props").PropsSummary) {
  const otherTabs = useMemo(() => {
    const browserTab = BrowserTabs(props.taskqueue.spec.local)
    return browserTab ? [browserTab] : []
  }, [props.taskqueue.spec.local])

  return <DrawerContent summary={summaryTabContent(props)} otherTabs={otherTabs} raw={props.taskqueue} />
}
