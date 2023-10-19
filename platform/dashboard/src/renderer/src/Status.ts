import { createContext, useEffect, useState } from "react"

import type { State } from "./Settings"

export type Status = null | {
  clusterExists: boolean
  core: boolean
  examples: boolean
  defaults: boolean
}

const StatusCtx = createContext<Status>(null)
export default StatusCtx

export function statusState(demoMode: State<boolean>) {
  const status = useState<Status>(null)
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
