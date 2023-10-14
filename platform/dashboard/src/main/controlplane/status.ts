import { clusterExists } from "../prereq/check"

export async function getStatusFromMain() {
  // Checking if we have a control plane cluster running
  return { clusterExists: await clusterExists(), core: true, example: false }
}

export type Status = ReturnType<typeof getStatusFromMain>
