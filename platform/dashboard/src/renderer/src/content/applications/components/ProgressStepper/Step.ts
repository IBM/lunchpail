import type { ReactNode } from "react"
import type { ProgressStepProps } from "@patternfly/react-core"

import type Props from "../Props"

/** Configuration of one Step of the `ProgressStepper` UI */
export default interface Step {
  id: string
  content: (props: Props, onClick: () => void) => ReactNode
  variant: (props: Props) => ProgressStepProps["variant"]
  icon?: (props: Props) => ReactNode
}
