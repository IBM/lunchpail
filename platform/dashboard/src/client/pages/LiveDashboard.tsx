import { Dashboard } from "./Dashboard"
import type NewPoolHandler from "../events/NewPoolHandler"
import type { LocationProps } from "../router/withLocation"

const newpool: NewPoolHandler = async (values, yaml) => {
  await fetch(`/newpool?yaml=${encodeURIComponent(yaml)}`)
}

export default function LiveDashboard(props: LocationProps) {
  return (
    <Dashboard
      datasets="/datasets"
      queues="/queues"
      pools="/pools"
      applications="/applications"
      newpool={newpool}
      {...props}
    />
  )
}
