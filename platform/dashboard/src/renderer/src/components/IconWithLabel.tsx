import type { PropsWithChildren, ReactNode } from "react"

import { Button, Flex, FlexItem, Popover } from "@patternfly/react-core"

import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon"
import ExclamationCircleIcon from "@patternfly/react-icons//dist/esm/icons/exclamation-circle-icon"

const gapXs = { default: "gapXs" as const }
const noWrap = { default: "nowrap" as const }

type PopoverProps = { popoverHeader?: ReactNode; popoverBody: ReactNode; status?: string }

function iconFor(props: PopoverProps) {
  return props.status === "Failed" ? (
    <ExclamationCircleIcon data-jaas-status={props.status} />
  ) : (
    <InfoCircleIcon data-jaas-status={props.status} />
  )
}

function popover(props: PopoverProps) {
  const icon = iconFor(props)

  return (
    <Popover
      headerIcon={icon}
      headerContent={props.popoverHeader}
      bodyContent={props.popoverBody}
      triggerAction="hover"
    >
      <Button
        variant="plain"
        size="sm"
        className="codeflare--control-plane-status-info"
        data-jaas-status={props.status}
      >
        {icon}
      </Button>
    </Popover>
  )
}

export default function IconWithLabel(props: PropsWithChildren<PopoverProps & { icon?: ReactNode }>) {
  const { popoverHeader, popoverBody } = props

  return (
    <Flex flexWrap={noWrap} gap={gapXs}>
      {props.icon && <FlexItem>{props.icon}</FlexItem>}
      {popoverBody && <FlexItem>{popover({ popoverHeader, popoverBody, status: props.status })}</FlexItem>}
      <FlexItem>{props.children}</FlexItem>
    </Flex>
  )
}
