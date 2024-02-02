import { dump } from "js-yaml"
import indent from "@jaas/common/util/indent"

import type Values from "../Values"
import type RunEvent from "@jaas/common/events/RunEvent"
import type WorkDispatcherEvent from "@jaas/common/events/WorkDispatcherEvent"

import baseYaml from "./base"
import helmYaml from "./helm"
import applicationYaml from "./application"
import tasksimulatorYaml from "./tasksimulator"
import parametersweepYaml from "./parametersweep"

function specForMethod(values: Values["values"], run: RunEvent) {
  switch (values.method) {
    case "tasksimulator":
      return tasksimulatorYaml(values)
    case "parametersweep":
      return parametersweepYaml(values)
    case "bucket":
      return ""
    case "helm":
      return helmYaml(values, run)
    case "application":
      return applicationYaml(values)
  }
}

export default function yaml(values: Values["values"], run: RunEvent) {
  const spec = specForMethod(values, run)
  return baseYaml(values.name, values.namespace, run, values.method) + (spec ? indent(spec, 2) : "")
}

export function yamlFromSpec(workdispatcher: WorkDispatcherEvent) {
  return dump(workdispatcher)
}
