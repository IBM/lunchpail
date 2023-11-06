import JobManagerCard from "./components/Card"
import JobManagerDetail from "./components/Detail"

import type ContentProvider from "../ContentProvider"

/** ControlPlane ContentProvider */
const controlplane: ContentProvider = {
  gallery: () => <JobManagerCard />,
  detail: () => <JobManagerDetail />,
}

export default controlplane
