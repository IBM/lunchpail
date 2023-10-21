import { useContext } from "react"

import Status from "../../Status"
import Settings from "../../Settings"

import camelCaseSplit from "../../util/camel-split"
import { dl, descriptionGroup } from "../DescriptionGroup"
import { descriptions } from "@jay/common/status/ControlPlaneStatus"

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
        { isCompact: true, isHorizontal: true, isAutoFit: true, isAutoColumnWidths: true, isFluid: true },
      )
    }
  } else {
    return "Currently running in offline demo mode."
  }
}
