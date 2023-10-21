import { createContext, useEffect, useState } from "react"

import type { State } from "./Settings"
import type ControlPlaneStatus from "@jay/common/status/ControlPlaneStatus"

export { ControlPlaneStatus }

type StatusCtxType = { status: null | ControlPlaneStatus; refreshStatus(): void }
const StatusCtx = createContext<StatusCtxType>({ status: null, refreshStatus: () => {} })
export default StatusCtx

export function statusState(demoMode: State<boolean>) {
  const status = useState<null | ControlPlaneStatus>(null)
  const [, setStatus] = status

  // launch an effect that triggers a control plane readiness check
  // whenever entering non-demo/live mode
  async function checkControlPlaneStatus() {
    if (!demoMode[0]) {
      // determine current cluster status
      const status = await window.jay.controlplane.status()
      setStatus(status)
      console.log("Control Plane Status", status)
    }
  }

  useEffect(() => {
    checkControlPlaneStatus()
  }, [demoMode[0]])

  return {
    status: status[0],
    refreshStatus: () => {
      checkControlPlaneStatus()
    },
  }
}
