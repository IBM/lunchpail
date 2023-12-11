import Values from "../Values"

import { singular } from "@jay/resources/workdispatchers/name"
import { StepAlertProps } from "@jay/components/NewResourceWizard"

import step2Helm, { helmIsValid } from "./Helm"
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

function checkIsValid(ctrl: Pick<Values, "values">): true | StepAlertProps<Values>[] {
  if (ctrl.values.method === "helm") {
    return helmIsValid(ctrl.values)
  } else {
    return true
  }
}

function isValid(ctrl: Pick<Values, "values">) {
  return !!checkIsValid(ctrl)
}

function alerts(values: Values["values"]): StepAlertProps<Values>[] {
  const info = {
    title: "Configure this " + singular,
    body: "Your choice of " + singular + " offers the following configuration settings.",
  }

  const valid = checkIsValid({ values })
  const errors = valid === true ? [] : valid

  return [info, ...errors]
}

/** This is the Configure step of the Wizard */
export default {
  name: "Configure",
  gridSpans,
  items,
  alerts,
  isValid,
}
