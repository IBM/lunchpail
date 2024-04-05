import type KubernetesResource from "@jaas/common/events/KubernetesResource"

/**
 * Remove junk annotations from a Kubernetes yaml, for improved
 * presentation.
 */
export default function trimJunk<R extends KubernetesResource>(resource: R) {
  const copy = JSON.parse(JSON.stringify(resource))

  if ("metadata" in copy && copy.metadata && typeof copy.metadata === "object") {
    for (const key of Object.keys(copy.metadata)) {
      if (key === "resourceVersion" || key === "generation" || key === "uid" || key === "finalizers") {
        delete copy.metadata[key]
      } else if (key === "annotations") {
        for (const akey of Object.keys(copy.metadata.annotations)) {
          if (/^lunchpail.io/.test(akey)) {
            //delete copy.metadata.annotations[akey]
          }
        }
      }
    }
    if ("annotations" in copy.metadata) {
      const annotations = copy.metadata.annotations
      if (annotations && typeof annotations === "object") {
        for (const key of Object.keys(annotations)) {
          if (
            key === "kubectl.kubernetes.io/last-applied-configuration" ||
            key === "kopf.zalando.org/last-handled-configuration"
          ) {
            delete annotations[key]
          }
        }
      }
    }
  }

  return JSON.stringify(copy)
}
