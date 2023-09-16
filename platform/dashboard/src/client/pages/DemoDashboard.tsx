import { Dashboard } from "./Dashboard"
import type { LocationProps } from "../router/withLocation"
import {
  DemoDataSetEventSource,
  DemoQueueEventSource,
  DemoWorkerPoolStatusEventSource,
  DemoApplicationSpecEventSource,
} from "../events/demo"

export default function DemoDashboard(props: LocationProps) {
  return (
    <Dashboard
      datasets={new DemoDataSetEventSource()}
      queues={new DemoQueueEventSource()}
      pools={new DemoWorkerPoolStatusEventSource()}
      applications={new DemoApplicationSpecEventSource()}
      {...props}
    />
  )
}
