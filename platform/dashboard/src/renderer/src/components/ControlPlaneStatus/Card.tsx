import { Ref, useContext, useEffect, useState } from "react"
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Divider,
  Dropdown,
  DropdownGroup,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Spinner,
  Text,
  TextContent,
} from "@patternfly/react-core"

import Detail from "./Detail"
import { isHealthy } from "./Summary"

import Status from "../../Status"
import Settings from "../../Settings"

import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon"

type Refreshing = null | "refreshing" | "updating" | "initializing" | "destroying"

function header(props: { refreshing: Refreshing; refresh(): void; update(): void; destroy(): void }) {
  const { status } = useContext(Status)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const onToggle = () => {
    setIsOpen(!isOpen)
  }

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      isExpanded={isOpen}
      onClick={onToggle}
      variant="plain"
      aria-label="Job manager action menu toggle"
    >
      <EllipsisVIcon aria-hidden="true" />
    </MenuToggle>
  )

  const dropdownItems = (
    <>
      <DropdownItem key="refresh" description="Re-scan for the latest status" onClick={props.refresh}>
        Refresh
      </DropdownItem>
      {isHealthy(status) && (
        <>
          <Divider component="li" />
          <DropdownGroup label="Manage" labelHeadingLevel="h3">
            <DropdownItem key="update" description="Update to the latest software" onClick={props.update}>
              Update
            </DropdownItem>
            <DropdownItem key="destroy" description="Tear down this job manager" onClick={props.destroy}>
              Destroy
            </DropdownItem>
          </DropdownGroup>
        </>
      )}
    </>
  )

  const actions = props.refreshing ? (
    <div
      style={{ paddingBlockStart: "6px", paddingBlockEnd: "6px", paddingInlineEnd: "16px", paddingInlineStart: "16px" }}
    >
      <Spinner size="md" />
    </div>
  ) : (
    <Dropdown onSelect={onToggle} toggle={toggle} isOpen={isOpen} onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}>
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  )

  return (
    <>
      <CardHeader actions={status ? { hasNoOffset: true, actions } : undefined} isToggleRightAligned>
        <CardTitle>Job Manager {props.refreshing && refreshingMessage({ refreshing: props.refreshing })}</CardTitle>
      </CardHeader>
    </>
  )
}

function body() {
  return (
    <>
      <CardBody>
        <TextContent>
          <Text component="p">I am here to manage and observe your resources.</Text>
        </TextContent>
      </CardBody>
      <CardBody isFilled>
        <Detail />
      </CardBody>
    </>
  )
}

function refreshingMessage({ refreshing }: { refreshing: NonNullable<Refreshing> }) {
  return <Text component="small"> &mdash; {refreshing[0].toUpperCase() + refreshing.slice(1)}</Text>
}

function footer(props: { refreshing: Refreshing; initialize(): void }) {
  const { status } = useContext(Status)
  const settings = useContext(Settings)

  return (
    !settings?.demoMode[0] &&
    !props.refreshing &&
    !isHealthy(status) && (
      <CardFooter>
        <Button isBlock size="lg" onClick={props.initialize}>
          Initialize
        </Button>
      </CardFooter>
    )
  )
}

export default function ControlPlaneStatusCard() {
  const { refreshStatus } = useContext(Status)
  const [refreshing, setRefreshing] = useState<Refreshing>(null)

  useEffect(() => {
    async function effect() {
      if (refreshing === "updating" || refreshing === "initializing") {
        await window.jay.controlplane.init()
      } else if (refreshing === "destroying") {
        await window.jay.controlplane.destroy()
      }

      setRefreshing(null)
      refreshStatus()
    }
    effect()
  }, [refreshing])

  const setTo = (msg: Refreshing) => () => {
    if (!refreshing) {
      setRefreshing(msg)
    }
  }

  const refresh = setTo("refreshing")
  const update = setTo("updating")
  const initialize = setTo("initializing")
  const destroy = setTo("destroying")

  return (
    <Card>
      {header({ refreshing, refresh, update, destroy })}
      {body()}
      {footer({ refreshing, initialize })}
    </Card>
  )
}
