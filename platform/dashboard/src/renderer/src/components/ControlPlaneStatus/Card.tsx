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
} from "@patternfly/react-core"

import Detail from "./Detail"
import { isHealthy } from "./Summary"

import Status from "../../Status"

import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon"

type Refreshing = null | "refreshing" | "updating" | "initializing" | "destroying"

function header(props: { refreshing: Refreshing; refresh(): void; update(): void; destroy(): void }) {
  const { status } = useContext(Status)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const onToggle = () => {
    setIsOpen(!isOpen)
  }

  const dropdownItems = (
    <>
      <DropdownItem key="refresh" description="Re-scan for the latest status" onClick={props.refresh}>
        Refresh
      </DropdownItem>
      <Divider component="li" />
      <DropdownGroup label="Manage" labelHeadingLevel="h3">
        {isHealthy(status) && (
          <DropdownItem key="update" description="Update control plane to the latest software" onClick={props.update}>
            Update
          </DropdownItem>
        )}
        <DropdownItem key="destroy" description="Tear down this control plane" onClick={props.destroy}>
          Destroy
        </DropdownItem>
      </DropdownGroup>
    </>
  )

  const actions = props.refreshing ? (
    <Spinner size="md" />
  ) : (
    <Dropdown
      onSelect={onToggle}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          isExpanded={isOpen}
          onClick={onToggle}
          variant="plain"
          aria-label="Card header without title example kebab toggle"
        >
          <EllipsisVIcon aria-hidden="true" />
        </MenuToggle>
      )}
      isOpen={isOpen}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
    >
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  )

  return (
    <CardHeader actions={status ? { hasNoOffset: true, actions } : undefined} isToggleRightAligned>
      <CardTitle>Control Plane</CardTitle>
    </CardHeader>
  )
}

function body() {
  return (
    <CardBody>
      <Detail />
    </CardBody>
  )
}

function bodyWhileRefreshing({ refreshing }: { refreshing: NonNullable<Refreshing> }) {
  return <CardBody>{refreshing[0].toUpperCase() + refreshing.slice(1)}</CardBody>
}

function footer(props: { refreshing: Refreshing; initialize(): void }) {
  const { status } = useContext(Status)

  return (
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

  const refresh = async () => {
    if (!refreshing) {
      setRefreshing("refreshing")
      await refreshStatus()
      setRefreshing(null)
    }
  }

  const update = async (msg: Refreshing = "updating") => {
    if (!refreshing) {
      setRefreshing(msg)
      await window.jaas.controlplane.init()
      setRefreshing(null)
      refreshStatus()
    }
  }

  const initialize = () => update("initializing")

  const destroy = async () => {
    if (!refreshing) {
      setRefreshing("destroying")
      await window.jaas.controlplane.destroy()
      setRefreshing(null)
      refreshStatus()
    }
  }

  useEffect(() => {}, [refreshing])

  return (
    <Card>
      {header({ refreshing, refresh, update, destroy })}
      {refreshing && bodyWhileRefreshing({ refreshing })}
      {body()}
      {footer({ refreshing, initialize })}
    </Card>
  )
}
