import { useContext } from "react"

import Status from "../../Status"
import Settings from "../../Settings"

import { dl, descriptionGroup } from "../DescriptionGroup"
import { descriptions } from "@jaas/common/status/ControlPlaneStatus"

function camelCaseSplit(str: string) {
  return str.replace(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g, " ")
}

export default function ControlPlaneStatusDetail() {
  const { status } = useContext(Status)
  const settings = useContext(Settings)

  if (!settings?.demoMode[0]) {
    if (!status) {
      return "The control plane is offline."
    } else {
      return dl(
        Object.entries(status).map(([key, value]) =>
          descriptionGroup(camelCaseSplit(key), value, undefined, descriptions[key]),
        ),
        { isCompact: true, isHorizontal: true, isAutoFit: true, isAutoColumnWidths: true },
      )
    }
  } else {
    return "Currently running in offline demo mode."
  }
}
