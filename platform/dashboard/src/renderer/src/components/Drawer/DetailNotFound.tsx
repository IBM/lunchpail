import { lazy, Suspense } from "react"

const EmptyState = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyState })))
const EmptyStateHeader = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateHeader })))
const EmptyStateBody = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateBody })))
const EmptyStateIcon = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.EmptyStateIcon })))

import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon"

/**
 * An empty state UI to indicate that the Drawer/details view is open
 * to a resource that does not (yet?) exist.
 */
export default function DetailNotFound() {
  return (
    <Suspense fallback={<></>}>
      <EmptyState>
        <EmptyStateHeader
          titleText="Resource not found"
          headingLevel="h4"
          icon={<EmptyStateIcon icon={SearchIcon} />}
        />
        <EmptyStateBody>It may still be loading. Hang tight.</EmptyStateBody>
      </EmptyState>
    </Suspense>
  )
}
