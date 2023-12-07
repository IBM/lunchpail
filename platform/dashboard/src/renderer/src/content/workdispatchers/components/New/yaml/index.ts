import { dump } from "js-yaml"
import indent from "@jay/common/util/indent"

import type Values from "../Values"
import type WorkDispatcherEvent from "@jay/common/events/WorkDispatcherEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

import baseYaml from "./base"
import helmYaml from "./helm"
import tasksimulatorYaml from "./tasksimulator"
import parametersweepYaml from "./parametersweep"

function specForMethod(values: Values["values"]) {
  switch (values.method) {
    case "tasksimulator":
      return tasksimulatorYaml(values)
    case "parametersweep":
      return parametersweepYaml(values)
    case "bucket":
      return ""
    case "helm":
      return helmYaml(values)
  }
}

export default function yaml(values: Values["values"], application: ApplicationSpecEvent, taskqueue: string) {
  const spec = specForMethod(values)
  return baseYaml(values.name, values.namespace, application, taskqueue, values.method) + (spec ? indent(spec, 2) : "")
}

export function yamlFromSpec(workdispatcher: WorkDispatcherEvent) {
  return dump(workdispatcher)
}
