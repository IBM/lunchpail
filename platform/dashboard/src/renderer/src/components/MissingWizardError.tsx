import { EmptyState, EmptyStateHeader, EmptyStateBody, EmptyStateIcon } from "@patternfly/react-core"

import type Kind from "../content/NavigableKind"

import BugIcon from "@patternfly/react-icons/dist/esm/icons/bug-icon"

type Props = {
  kind: Kind
}

export default function MissingWizardError(props: Props) {
  return (
    <EmptyState tabIndex={0}>
      <EmptyStateHeader titleText="Internal Error" headingLevel="h4" icon={<EmptyStateIcon icon={BugIcon} />} />
      <EmptyStateBody>
        This is a bug in the content provider for <strong>{props.kind}</strong>. It does not define a Wizard handler.
      </EmptyStateBody>
    </EmptyState>
  )
}
