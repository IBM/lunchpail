import { stopPropagation } from "@jaas/renderer/navigate"
import { ProgressStepper, ProgressStep } from "@patternfly/react-core"

// the Steps of this ProgressStepper
import steps from "./steps"

// the Popover detail/helpers for each Step
import Popovers from "./popovers"

import { singular as Run } from "../../name"

import type Props from "@jaas/resources/runs/components/Props"

import "./RunProgressStepper.css"

export default function AplicationProgressStepper(props: Props) {
  const popovers = Popovers(props)

  return (
    <ProgressStepper>
      {steps.map((step, idx) => (
        <ProgressStep
          key={step.id}
          id={`${Run}-${props.run.metadata.name}.step-${step.id}`}
          aria-label={`${Run}-${props.run.metadata.name}.step-${step.id}`}
          titleId={step.id}
          onClick={stopPropagation}
          variant={step.variant(props)}
          popoverRender={popovers[idx]}
          icon={step.icon && step.icon(props)}
        >
          {step.id}
        </ProgressStep>
      ))}
    </ProgressStepper>
  )
}
