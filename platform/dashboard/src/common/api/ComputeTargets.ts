import type ComputeTargetEvent from "../events/ComputeTargetEvent"

/** The ComputeTargets API */
export default interface ComputeTargetsApi {
  /** Delete the given named `ComputeTarget` */
  delete(target: ComputeTargetEvent)
}
