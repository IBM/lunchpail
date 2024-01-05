import type S3Api from "./s3"
import type KubernetesApi from "./kubernetes"
import type ControlPlaneApi from "./ControlPlane"

export type { DeleteProps, JayResourceApi, OnModelUpdateFn } from "./kubernetes"

/** Jobs as a Service API to server-side functionality */
export default interface JayApi extends KubernetesApi {
  /** Jobs as a Service API to server-side control plane functionality */
  controlplane: ControlPlaneApi

  /** S3 API */
  s3?: S3Api
}
