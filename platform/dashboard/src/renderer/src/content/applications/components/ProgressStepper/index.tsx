import { stopPropagation } from "@jaas/renderer/navigate"
import { ProgressStepper, ProgressStep } from "@patternfly/react-core"

// the Steps of this ProgressStepper
import steps from "./steps"

// the Popover detail/helpers for each Step
import Popovers from "./popovers"

export default function AplicationProgressStepper(props: import("../Props").default) {
  const popovers = Popovers(props)

  return (
    <ProgressStepper>
      {steps.map((step, idx) => (
        <ProgressStep
          key={step.id}
          id={step.id}
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
