import Values from "../Values"

import { singular } from "@jay/resources/workdispatchers/name"

import step2Helm from "./Helm"
import step2TaskSimulatorItems from "./TaskSimulator"
import step2ParameterSweepItems from "./ParameterSweep"

const gridSpans = (values: Values["values"]) =>
  values.method === "tasksimulator" ? ([6, 6, 12, 12] as const) : values.method === "parametersweep" ? 4 : 12

const items = (values: Values["values"]) =>
  values.method === "tasksimulator"
    ? step2TaskSimulatorItems
    : values.method === "parametersweep"
      ? step2ParameterSweepItems
      : values.method === "helm"
        ? step2Helm
        : []

const alerts = [
  {
    title: "Configure this " + singular,
    body: "Your choice of " + singular + " offers the following configuration settings.",
  },
]

/** This is the Configure step of the Wizard */
export default {
  name: "Configure",
  gridSpans,
  items,
  alerts,
}
