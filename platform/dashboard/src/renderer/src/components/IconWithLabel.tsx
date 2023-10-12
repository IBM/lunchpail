import type { ReactNode } from "react"

import { Flex, FlexItem } from "@patternfly/react-core"

const gapSm = { default: "gapSm" as const }
const noWrap = { default: "nowrap" as const }

export default function IconWithLabel(label: string, icon: ReactNode) {
  return (
    <Flex flexWrap={noWrap} gap={gapSm}>
      <FlexItem>{icon}</FlexItem>
      <FlexItem>{label}</FlexItem>
    </Flex>
  )
}
