import DrawerContent from "@jaas/components/Drawer/Content"
import summaryTabContent from "./tabs/Summary"

import type { PropsSummary as Props } from "./Props"

export default function TaskQueueDetail(props: Props) {
  return <DrawerContent summary={summaryTabContent(props)} raw={props.taskqueue} />
}
