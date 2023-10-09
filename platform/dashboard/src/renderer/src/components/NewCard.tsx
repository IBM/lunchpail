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

import type { PropsWithChildren } from "react"
import type { LocationProps } from "../router/withLocation"

import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon"

type Props = Omit<LocationProps, "navigate"> &
  PropsWithChildren<{
    title: string
    description: string
  }>

export default function NewCard(props: Props) {
  return (
    <Card isCompact>
      <Bullseye>
        <EmptyState variant="lg">
          <EmptyStateHeader headingLevel="h2" titleText={props.title} icon={<EmptyStateIcon icon={PlusCircleIcon} />} />
          <EmptyStateBody>{props.description}</EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>{props.children}</EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      </Bullseye>
    </Card>
  )
}
