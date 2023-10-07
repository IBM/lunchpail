import {
  Card,
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateFooter,
  EmptyStateActions,
} from "@patternfly/react-core"

import type { LocationProps } from "../../../router/withLocation"
import { linkToNewPool } from "../../../navigate/newpool"

import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon"

function AddWorkerPoolButton(props: Omit<LocationProps, "navigate">) {
  return linkToNewPool(undefined, props, "create", { isInline: true, variant: "link" })
}

export default function NewWorkerPoolCard(props: Omit<LocationProps, "navigate">) {
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
              <AddWorkerPoolButton {...props} />
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      </Bullseye>
    </Card>
  )
}
