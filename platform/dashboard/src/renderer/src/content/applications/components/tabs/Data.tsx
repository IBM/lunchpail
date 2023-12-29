import None from "@jay/components/None"
import DrawerTab from "@jay/components/Drawer/Tab"
import { linkToAllDetails } from "@jay/renderer/navigate/details"
import { dl, descriptionGroup } from "@jay/components/DescriptionGroup"

import type Props from "../Props"
import { datasets } from "../taskqueueProps"

import { singular } from "@jay/resources/applications/name"
import { name as datasetsName } from "@jay/resources/datasets/name"

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
