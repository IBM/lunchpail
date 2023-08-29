import { PageSidebar, PageSidebarBody, PageToggleButton } from "@patternfly/react-core"
import { useState } from "react"
import BarsIcon from "@patternfly/react-icons/dist/esm/icons/bars-icon"

export const SidebarContent: React.FunctionComponent = () => {
  const [isSidebarOpen] = useState(true)

  return (
    <PageSidebar isSidebarOpen={!isSidebarOpen} id="vertical-sidebar">
      <PageSidebarBody>Hello from Sidebar!</PageSidebarBody>
    </PageSidebar>
  )
}

export const SidebarToggle = (
  <PageToggleButton variant="plain" aria-label="Global navigation" id="vertical-nav-toggle">
    <BarsIcon />
  </PageToggleButton>
)
