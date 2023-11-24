import { useCallback, useState, type RefObject } from "react"
import { Popover } from "@patternfly/react-core"

import steps from "./steps" // the Steps of this ProgressStepper
import { isBodyAndFooter } from "./Step"

export default function ApplicationProgressStepperPopovers(props: import("../Props").default) {
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
  return steps.map((step, idx) =>
    useCallback(
      (stepRef: RefObject<HTMLElement>) => {
        const content = step.content(props, visibleOff[idx])
        const body = !isBodyAndFooter(content) ? content : content.body
        const footer = !isBodyAndFooter(content) ? undefined : content.footer

        return (
          <Popover
            position="bottom"
            isVisible={isVisible[idx]}
            shouldOpen={visibleOn[idx]}
            shouldClose={visibleOff[idx]}
            aria-label={`${step.id} detail popover`}
            headerContent={step.id}
            bodyContent={body}
            footerContent={footer}
            triggerRef={stepRef}
          />
        )
      },
      [step, props, isVisible[idx], visibleOn, visibleOff],
    ),
  )
}
