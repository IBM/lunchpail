import datasets from "./datasets"
import taskqueues from "./taskqueues"
import workerpools from "./workerpools"
import controlplane from "./controlplane"
import applications from "./applications"
import platformreposecrets from "./platformreposecrets"

/**
 * These are the resource Kinds for which we have UI componetry.
 */
export default {
  controlplane,
  platformreposecrets,
  applications,
  taskqueues,
  datasets,
  workerpools,
}
