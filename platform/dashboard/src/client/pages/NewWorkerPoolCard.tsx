import { Link } from "react-router-dom"

import {
  Card,
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateFooter,
  EmptyStateActions,
} from "@patternfly/react-core"

import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon"

function AddWorkerPoolButton() {
  return (
    <Button
      isInline
      variant="link"
      component={(props) => (
        <Link {...props} to="#newpool">
          Add Worker Pool
        </Link>
      )}
    />
  )
}

export default function NewWorkerPoolCard() {
  return (
    <Card isCompact>
      <Bullseye>
        <EmptyState variant="lg">
          <EmptyStateHeader
            headingLevel="h2"
            titleText="New Worker Pool"
            icon={<EmptyStateIcon icon={PlusCircleIcon} />}
          />
          <EmptyStateBody>Bring online additional compute resources to help service unprocessed tasks.</EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <AddWorkerPoolButton />
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      </Bullseye>
    </Card>
  )
}
