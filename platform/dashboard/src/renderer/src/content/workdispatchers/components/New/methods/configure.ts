import type Values from "../Values"
import type Context from "../Context"

import { singular } from "@jaas/resources/workdispatchers/name"
import { StepAlertProps } from "@jaas/components/NewResourceWizard"

import step2Helm, { helmIsValid } from "./Helm"
import step2TaskSimulatorItems from "./TaskSimulator"
import step2ParameterSweepItems from "./ParameterSweep"
import step2Application, { applicationIsValid } from "./Application"

const gridSpans = (values: Values["values"]) =>
  values.method === "tasksimulator" ? ([6, 6, 12, 12] as const) : values.method === "parametersweep" ? 4 : 12

const items = ({ values }: Values, context: Context) =>
  values.method === "tasksimulator"
    ? step2TaskSimulatorItems
    : values.method === "parametersweep"
      ? step2ParameterSweepItems
      : values.method === "helm"
        ? step2Helm
        : values.method === "application"
          ? step2Application(context)
          : []

function checkIsValid(ctrl: Pick<Values, "values">, context: Context): true | StepAlertProps<Values>[] {
  if (ctrl.values.method === "helm") {
    return helmIsValid(ctrl.values)
  } else if (ctrl.values.method === "application") {
    return applicationIsValid(ctrl.values, context)
  } else {
    return true
  }
}

function isValid(ctrl: Pick<Values, "values">, context: Context) {
  return !!checkIsValid(ctrl, context)
}

function alerts(values: Values["values"], context: Context): StepAlertProps<Values>[] {
  const info = {
    title: "Configure this " + singular,
    body: "Your choice of " + singular + " offers the following configuration settings.",
  }

  const valid = checkIsValid({ values }, context)
  const errors = valid === true ? [] : valid

  return [info, ...errors]
}

/** This is the Configure step of the Wizard */
export default {
  name: "Configure your " + singular,
  gridSpans,
  items,
  alerts,
  isValid,
}
