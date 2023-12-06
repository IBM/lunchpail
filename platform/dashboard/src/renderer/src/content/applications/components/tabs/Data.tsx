import DrawerTab from "@jay/components/Drawer/Tab"
import { dl } from "@jay/components/DescriptionGroup"

import type Props from "../Props"
import { datasetsGroup } from "../common"

export default function DataTab(props: Props) {
  return DrawerTab({
    title: "Data",
    body: dl({ groups: [datasetsGroup(props)] }),
  })
}
