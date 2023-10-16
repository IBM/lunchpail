import type { PropsWithChildren, ReactNode } from "react"

import { Button, Flex, FlexItem, Popover } from "@patternfly/react-core"

import { stopPropagation } from "../navigate"

import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon"

const gapSm = { default: "gapSm" as const }
const noWrap = { default: "nowrap" as const }

function popover(props: { popoverHeader?: ReactNode; popoverBody: ReactNode }) {
  return (
    <Popover headerContent={props.popoverHeader} bodyContent={props.popoverBody}>
      <Button onClick={stopPropagation} variant="plain" size="sm" className="codeflare--control-plane-status-info">
        <InfoCircleIcon />
      </Button>
    </Popover>
  )
}

export default function IconWithLabel(
  props: PropsWithChildren<{ icon?: ReactNode; popoverHeader?: ReactNode; popoverBody?: ReactNode }>,
) {
  const { popoverHeader, popoverBody } = props

  return (
    <Flex flexWrap={noWrap} gap={gapSm}>
      <FlexItem>{props.children}</FlexItem>
      {props.icon && <FlexItem>{props.icon}</FlexItem>}
      {popoverBody && <FlexItem>{popover({ popoverHeader, popoverBody })}</FlexItem>}
    </Flex>
  )
}
