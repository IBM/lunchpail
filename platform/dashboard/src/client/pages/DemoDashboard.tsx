import { Dashboard } from "./Dashboard"
import type { LocationProps } from "../router/withLocation"
import { DemoDataSetEventSource, DemoQueueEventSource, DemoWorkerPoolStatusEventSource } from "../events/demo"

export default function DemoDashboard(props: LocationProps) {
  return (
    <Dashboard
      datasets={new DemoDataSetEventSource()}
      queues={new DemoQueueEventSource()}
      pools={new DemoWorkerPoolStatusEventSource()}
      {...props}
    />
  )
}
