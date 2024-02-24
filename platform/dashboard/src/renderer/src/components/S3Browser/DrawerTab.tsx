import type PathPrefix from "./PathPrefix"
import type DataSetEvent from "@jaas/common/events/DataSetEvent"
import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"

import DrawerTab from "@jaas/components/Drawer/Tab"
import S3BrowserThatFetchesCreds from "./S3BrowserThatFetchesCreds"

/** A Drawer tab that shows <S3Browser /> */
export default function S3BrowserTab(
  props: (DataSetEvent | TaskQueueEvent)["spec"]["local"] & Partial<PathPrefix> & { title?: string },
) {
  if (window.jaas.get && window.jaas.s3) {
    return DrawerTab({
      hasNoPadding: true,
      title: props.title ?? "Browser",
      body: <S3BrowserThatFetchesCreds {...props} get={window.jaas.get} s3={window.jaas.s3} />,
    })
  } else {
    return undefined
  }
}
