import { dump } from "js-yaml"

import type { Values } from "../Wizard"
import type WorkDispatcherEvent from "@jay/common/events/WorkDispatcherEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

import tasksimulatorYaml from "./tasksimulator"

export default function yaml(values: Values["values"], application: ApplicationSpecEvent, taskqueue: string) {
  switch (values.method) {
    case "tasksimulator":
      return tasksimulatorYaml(values, application, taskqueue)
    case "bucket":
      return "TODO"
    case "helm":
      return "TODO"
  }
}

export function yamlFromSpec(workdispatcher: WorkDispatcherEvent) {
  return dump(workdispatcher)
}
