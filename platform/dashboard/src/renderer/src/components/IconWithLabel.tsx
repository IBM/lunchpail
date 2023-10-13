import type { PropsWithChildren, ReactNode } from "react"

import { Flex, FlexItem } from "@patternfly/react-core"

const gapSm = { default: "gapSm" as const }
const noWrap = { default: "nowrap" as const }

export default function IconWithLabel(props: PropsWithChildren<{ icon: ReactNode }>) {
  return (
    <Flex flexWrap={noWrap} gap={gapSm}>
      <FlexItem>{props.children}</FlexItem>
      <FlexItem>{props.icon}</FlexItem>
    </Flex>
  )
}
