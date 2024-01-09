import { createContext, useEffect, useState } from "react"

import type { State } from "./Settings"
import type JobManagerStatus from "@jay/common/status/JobManagerStatus"

export { JobManagerStatus }

type Refreshing = null | "refreshing" | "updating" | "initializing" | "destroying"

/**
 * Either pass the updated value, or a function that takes the current
 * value and returns the new value.
 */
type StatusSetter = Refreshing | ((curRefreshing: Refreshing) => Refreshing)

export type StatusCtxType = {
  status: null | JobManagerStatus
  refreshing: Refreshing
  setTo(status: StatusSetter): void
}
const StatusCtx = createContext<StatusCtxType>({ status: null, refreshing: null, setTo: () => {} })
export default StatusCtx

export function statusState(demoMode: State<boolean>) {
  const [refreshing, setRefreshing] = useState<Refreshing>(null)
  const status = useState<null | JobManagerStatus>(null)
  const [, setStatus] = status

  // launch an effect that triggers a control plane readiness check
  // whenever entering non-demo/live mode
  async function checkJobManagerStatus() {
    if (!demoMode[0]) {
      // determine current cluster status
      const status = await window.jay.controlplane.status()
      setStatus(status)
      console.log("Control Plane Status", status)
    }
  }

  useEffect(() => {
    checkJobManagerStatus()
  }, [demoMode[0]])

  useEffect(() => {
    async function effect() {
      if (refreshing === "updating") {
        await window.jay.controlplane.update()
        setRefreshing("refreshing")
      } else if (refreshing === "initializing") {
        await window.jay.controlplane.init()
        setRefreshing("refreshing")
      } else if (refreshing === "destroying") {
        await window.jay.controlplane.destroy()
        setRefreshing("refreshing")
      } else if (refreshing === "refreshing") {
        await checkJobManagerStatus()
        setRefreshing(null)
      }
    }
    effect()
  }, [refreshing])

  return {
    status: status[0],
    refreshing: refreshing,
    setTo: (status: StatusSetter) => setRefreshing(status),
  }
}
