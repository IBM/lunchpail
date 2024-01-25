import { dump } from "js-yaml"
import indent from "@jaas/common/util/indent"

import type Values from "../Values"
import type WorkDispatcherEvent from "@jaas/common/events/WorkDispatcherEvent"
import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"

import baseYaml from "./base"
import helmYaml from "./helm"
import tasksimulatorYaml from "./tasksimulator"
import parametersweepYaml from "./parametersweep"

function specForMethod(values: Values["values"], application: ApplicationSpecEvent) {
  switch (values.method) {
    case "tasksimulator":
      return tasksimulatorYaml(values)
    case "parametersweep":
      return parametersweepYaml(values)
    case "bucket":
      return ""
    case "helm":
      return helmYaml(values, application)
  }
}

export default function yaml(values: Values["values"], application: ApplicationSpecEvent, taskqueue: string) {
  const spec = specForMethod(values, application)
  return baseYaml(values.name, values.namespace, application, taskqueue, values.method) + (spec ? indent(spec, 2) : "")
}

export function yamlFromSpec(workdispatcher: WorkDispatcherEvent) {
  return dump(workdispatcher)
}
