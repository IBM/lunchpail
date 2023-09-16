import { Dashboard } from "./Dashboard"
import type { LocationProps } from "../router/withLocation"

export default function LiveDashboard(props: LocationProps) {
  return <Dashboard datasets="/datasets" queues="/queues" pools="/pools" applications="/applications" {...props} />
}
