import { load } from "js-yaml"
import Input from "@jaas/components/Forms/Input"
import TextArea from "@jaas/components/Forms/TextArea"
import NumberInput from "@jaas/components/Forms/NumberInput"

import { singular as run } from "@jaas/resources/runs/name"
import { singular as workerpool } from "@jaas/resources/workerpools/name"
import { singular as application } from "@jaas/resources/applications/name"

import type Values from "../Values"

function runChoice(ctrl: Values) {
  return (
    <Input
      readOnlyVariant="default"
      fieldId="run"
      label={run}
      description={`The workers in this ${workerpool} will run the code specified by the ${application} associated with this ${run}`}
      ctrl={ctrl}
    />
  )
}

/** Form element to choose number of workers in this new Worker Pool */
function numWorkers(ctrl: Values) {
  return (
    <NumberInput
      min={1}
      ctrl={ctrl}
      fieldId="count"
      label="Worker count"
      description="Number of Workers in this pool"
      defaultValue={ctrl.values.count ? parseInt(ctrl.values.count, 10) : 1}
    />
  )
}

/** Environment variables to associate with the running workers */
function envvars(ctrl: Values) {
  return (
    <TextArea
      fieldId="env"
      label="Environment Variables"
      labelInfo="Provide this in YAML format, as key: value"
      rows={10}
      showLineNumbers
      language="yaml"
      isRequired={false}
      ctrl={ctrl}
    />
  )
}

function isValidAsEnvVars(env: string, rethrow = false) {
  try {
    const obj = load(env)
    if (!obj) {
      return true
    } else if (typeof obj !== "object") {
      const message = "Provided YAML is not an object"
      if (rethrow) {
        throw new Error(message)
      } else {
        console.error(message)
        return false
      }
    } else {
      const invalidKeys = Object.entries(obj).filter(([, value]) => typeof value !== "string")
      if (invalidKeys.length === 0) {
        return true
      } else {
        const message = `The following keys do not have string values: ${invalidKeys.map((_) => _[0]).join(",")}`
        if (rethrow) {
          throw new Error(message)
        } else {
          console.error(message)
          return false
        }
      }
    }
  } catch (err) {
    if (rethrow) {
      throw err
    } else {
      console.error(err)
      return false
    }
  }
}

function alerts(values: Values["values"]) {
  if (!values.env) {
    return []
  } else {
    try {
      !isValidAsEnvVars(values.env, true)
      return []
    } catch (err) {
      return [
        {
          title: "Invalid YAML provided for environment variables",
          body: String(err),
          variant: "danger" as const,
        },
      ]
    }
  }
}

export default {
  name: "Configure your " + workerpool,
  isValid: (ctrl: Values) => !!ctrl.values.run && (!ctrl.values.env || isValidAsEnvVars(ctrl.values.env)),
  items: [runChoice, numWorkers, envvars],
  alerts,
}
