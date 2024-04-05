import { dump } from "js-yaml"
import { type ComputeTarget } from "@jaas/common/events/ComputeTargetEvent"

export type YamlProps = Pick<ComputeTarget["metadata"], "name" | "namespace"> & {
  type: "Kind"
}

/**
 * @return the yaml spec to create/delete an Application
 */
export default function yaml(values: YamlProps) {
  const model: ComputeTarget = {
    apiVersion: "lunchpail.io/v1alpha1",
    kind: "ComputeTarget",
    metadata: {
      name: values.name,
      namespace: values.namespace,
    },
    spec: {
      type: values.type,
    },
  }

  return dump(model)
}
