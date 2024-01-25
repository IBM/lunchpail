import None from "@jaas/components/None"
import DrawerTab from "@jaas/components/Drawer/Tab"
import { linkToAllDetails } from "@jaas/renderer/navigate/details"
import { dl, descriptionGroup } from "@jaas/components/DescriptionGroup"

import type Props from "../Props"
import { datasets } from "../taskqueueProps"

import { singular } from "@jaas/resources/applications/name"
import { name as datasetsName } from "@jaas/resources/datasets/name"

function datasetsGroup(data: ReturnType<typeof datasets>) {
  return (
    data.length > 0 &&
    descriptionGroup(
      datasetsName,
      data.length === 0 ? None() : linkToAllDetails("datasets", data),
      data.length,
      `The ${datasetsName} this ${singular} requires as input.`,
    )
  )
}

export default function DataTab(props: Props) {
  const data = datasets(props)

  return DrawerTab({
    title: "Data",
    count: data.length,
    body: dl({ groups: [datasetsGroup(data)] }),
  })
}
