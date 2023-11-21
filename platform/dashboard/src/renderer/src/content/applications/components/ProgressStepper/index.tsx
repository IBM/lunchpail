import { useCallback, useState } from "react"
import { Popover, ProgressStepper, ProgressStep } from "@patternfly/react-core"

import { stopPropagation } from "@jay/renderer/navigate"

// the Application props
import type Props from "../Props"

// this is the Step type
import type Step from "./Step"

// these are the Step impls
import Code from "./steps/Code"
import Data from "./steps/Data"
import Compute from "./steps/Compute"
import WorkDispatcher from "./steps/WorkDispatcher"

/** These are the Steps we want to display in the `ProgressStepper` UI */
const steps: Step[] = [Code, Data, WorkDispatcher, Compute]

export default function AplicationAccordion(props: Props) {
  // sigh, patternfly has us managing popover visibility, since we
  // have clickable links inside our Popovers
  const [isVisible, setIsVisible] = useState<boolean[]>(Array(steps.length).fill(false))

  // one visibleOn/Off per Step
  const visibleSet = (isVisible: boolean) =>
    Array(steps.length)
      .fill(0)
      .map((_, idx) =>
        useCallback(
          () => setIsVisible((curState) => [...curState.slice(0, idx), isVisible, ...curState.slice(idx + 1)]),
          [],
        ),
      )
  const visibleOn = visibleSet(true)
  const visibleOff = visibleSet(false)

  // one popover per Step
  const popovers = steps.map((step, idx) =>
    useCallback(
      (stepRef) => (
        <Popover
          position="bottom"
          isVisible={isVisible[idx]}
          shouldOpen={visibleOn[idx]}
          shouldClose={visibleOff[idx]}
          aria-label={`${step.id} help`}
          headerContent={step.id}
          bodyContent={step.content(props, visibleOff[idx])}
          triggerRef={stepRef}
        />
      ),
      [props, isVisible[idx]],
    ),
  )

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
