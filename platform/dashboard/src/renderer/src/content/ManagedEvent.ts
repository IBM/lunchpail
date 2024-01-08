import WatchedKind from "@jay/common/Kind"

import type QueueEvent from "@jay/common/events/QueueEvent"
import type DataSetEvent from "@jay/common/events/DataSetEvent"
import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"
import type ComputeTargetEvent from "@jay/common/events/ComputeTargetEvent"
import type WorkDispatcherEvent from "@jay/common/events/WorkDispatcherEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"
import type WorkerPoolStatusEvent from "@jay/common/events/WorkerPoolStatusEvent"
import type PlatformRepoSecretEvent from "@jay/common/events/PlatformRepoSecretEvent"

export type ManagedEvent<Kind extends WatchedKind> = Kind extends "taskqueues"
  ? TaskQueueEvent
  : Kind extends "datasets"
    ? DataSetEvent
    : Kind extends "queues"
      ? QueueEvent
      : Kind extends "workerpools"
        ? WorkerPoolStatusEvent
        : Kind extends "applications"
          ? ApplicationSpecEvent
          : Kind extends "platformreposecrets"
            ? PlatformRepoSecretEvent
            : Kind extends "workdispatchers"
              ? WorkDispatcherEvent
              : Kind extends "computetargets"
                ? ComputeTargetEvent
                : never

type ManagedEvents = {
  [Kind in WatchedKind]: ManagedEvent<Kind>[]
}

export default ManagedEvents
