import { lazy, Suspense, type ReactNode } from "react"

const EmptyState = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyState })))
const EmptyStateHeader = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateHeader })))
const EmptyStateBody = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateBody })))
const EmptyStateIcon = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateIcon })))
const EmptyStateActions = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateActions })))
const EmptyStateFooter = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateFooter })))

import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon"

type Props = {
  title?: string
  action?: ReactNode
  children?: ReactNode
}

/**
 * An empty state UI to indicate that the Drawer/details view is open
 * to a resource that does not (yet?) exist.
 */
export default function DetailNotFound(props: Props) {
  return (
    <Suspense fallback={<></>}>
      <EmptyState>
        <EmptyStateHeader
          titleText={props.title ?? "Resource not found"}
          headingLevel="h4"
          icon={<EmptyStateIcon icon={SearchIcon} />}
        />
        <EmptyStateBody>{props.children ?? "It may still be loading. Hang tight."}</EmptyStateBody>
        {props.action && (
          <EmptyStateFooter>
            <EmptyStateActions>{props.action}</EmptyStateActions>
          </EmptyStateFooter>
        )}
      </EmptyState>
    </Suspense>
  )
}
