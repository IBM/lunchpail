import type S3Api from "./s3"
import type KubernetesApi from "./kubernetes"
import type ControlPlaneApi from "./ControlPlane"

export type { DeleteProps, JaasResourceApi, OnModelUpdateFn } from "./kubernetes"

/** Jobs as a Service API to server-side functionality */
export default interface JaasApi extends KubernetesApi {
  /** Jobs as a Service API to server-side control plane functionality */
  controlplane: ControlPlaneApi

  /** S3 API */
  s3?: S3Api
}
