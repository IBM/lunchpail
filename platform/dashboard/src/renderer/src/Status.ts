import { createContext, useEffect, useState } from "react"

import type { State } from "./Settings"
import type ControlPlaneStatus from "@jaas/common/status/ControlPlaneStatus"

export { ControlPlaneStatus }

const StatusCtx = createContext<null | ControlPlaneStatus>(null)
export default StatusCtx

export function statusState(demoMode: State<boolean>) {
  const status = useState<null | ControlPlaneStatus>(null)
  const [, setStatus] = status

  // launch an effect that triggers a control plane readiness check
  // whenever entering non-demo/live mode
  useEffect(() => {
    async function checkControlPlaneStatus() {
      if (!demoMode[0]) {
        // determine current cluster status
        const status = await window.jaas.controlplane.status()
        setStatus(status)
        console.log("Control Plane Status", status)
      }
    }
    checkControlPlaneStatus()
  }, [demoMode[0]])

  return status
}
