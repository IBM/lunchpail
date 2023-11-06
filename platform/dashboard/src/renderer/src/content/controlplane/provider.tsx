import type ContentProvider from "../ContentProvider"

import JobManagerCard from "../../components/JobManager/Card"
import JobManagerDetail from "../../components/JobManager/Detail"

/** ControlPlane ContentProvider */
const controlplane: ContentProvider = {
  gallery: () => <JobManagerCard />,
  detail: () => <JobManagerDetail />,
}

export default controlplane
