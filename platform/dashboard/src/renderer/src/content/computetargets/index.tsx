import JobManagerCard from "./components/Card"
import JobManagerDetail from "./components/Detail"

import description from "./description"
import { name, singular } from "./name"

import type ContentProvider from "../ContentProvider"

/** ComputeTarget ContentProvider */
const computetargets: ContentProvider<"computetargets"> = {
  kind: "computetargets",
  name,
  singular,
  isInSidebar: true as const,
  sidebarPriority: -10,
  description,
  gallery: () => <JobManagerCard />,
  detail: () => ({ body: <JobManagerDetail /> }),
}

export default computetargets
