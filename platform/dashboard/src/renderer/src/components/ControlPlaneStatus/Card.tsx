import { Ref, useContext, useState } from "react"
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
} from "@patternfly/react-core"

import Detail from "./Detail"
import { isHealthy } from "./Summary"

import Status from "../../Status"

import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon"

function header() {
  const status = useContext(Status)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const onToggle = () => {
    setIsOpen(!isOpen)
  }

  const dropdownItems = (
    <>
      <DropdownItem key="refresh" description="Re-scan for the latest status">
        Refresh
      </DropdownItem>
      <Divider component="li" />
      <DropdownGroup label="Manage" labelHeadingLevel="h3">
        {isHealthy(status) && (
          <DropdownItem key="update" description="Update control plane to the latest software">
            Update
          </DropdownItem>
        )}
        <DropdownItem key="destroy" description="Tear down this control plane">
          Destroy
        </DropdownItem>
      </DropdownGroup>
    </>
  )

  const actions = (
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
    <CardHeader actions={{ actions }} isToggleRightAligned>
      <CardTitle>Control Plane</CardTitle>
    </CardHeader>
  )
}

function body() {
  return (
    <CardBody isFilled>
      <Detail />
    </CardBody>
  )
}

function footer() {
  const status = useContext(Status)

  return (
    !isHealthy(status) && (
      <CardFooter>
        <Button isBlock size="lg">
          Initialize
        </Button>
      </CardFooter>
    )
  )
}

export default function ControlPlaneStatusCard() {
  return (
    <Card>
      {header()}
      {body()}
      {footer()}
    </Card>
  )
}
