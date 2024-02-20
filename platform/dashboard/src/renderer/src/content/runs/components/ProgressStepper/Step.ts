import type { ReactNode } from "react"
import type { ProgressStepProps } from "@patternfly/react-core"

import type Props from "@jaas/resources/runs/components/Props"

type BodyAndFooterContent = { body: ReactNode; footer: ReactNode }
type Content = ReactNode | BodyAndFooterContent

export function isBodyAndFooter(content: Content): content is BodyAndFooterContent {
  const { body, footer } = content as BodyAndFooterContent
  return !!body && !!footer
}

/** Configuration of one Step of the `ProgressStepper` UI */
export default interface Step {
  id: string
  content: (props: Props, onClick: () => void) => Content
  variant: (props: Props) => ProgressStepProps["variant"]
  icon?: (props: Props) => ReactNode
}
