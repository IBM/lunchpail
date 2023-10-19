import Status from "../../Status"
import Settings from "../../Settings"

import { dl, descriptionGroup } from "../DescriptionGroup"
import { descriptions } from "@jaas/common/status/ControlPlaneStatus"

export default function ControlPlaneStatusDetail() {
  return (
    <Settings.Consumer>
      {(settings) => {
        if (!settings?.demoMode[0]) {
          return (
            <Status.Consumer>
              {(status) => {
                if (!status) {
                  return "Checking on the status of the control plane..."
                } else {
                  return dl(
                    Object.entries(status).map(([key, value]) =>
                      descriptionGroup(key, value, undefined, descriptions[key]),
                    ),
                    { isCompact: true, isHorizontal: true, isAutoFit: true, isAutoColumnWidths: true },
                  )
                }
              }}
            </Status.Consumer>
          )
        } else {
          return "Currently running in offline demo mode."
        }
      }}
    </Settings.Consumer>
  )
}
