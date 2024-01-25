import WatchedKind from "@jaas/common/Kind"

import type QueueEvent from "@jaas/common/events/QueueEvent"
import type DataSetEvent from "@jaas/common/events/DataSetEvent"
import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"
import type ComputeTargetEvent from "@jaas/common/events/ComputeTargetEvent"
import type WorkDispatcherEvent from "@jaas/common/events/WorkDispatcherEvent"
import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"
import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"
import type PlatformRepoSecretEvent from "@jaas/common/events/PlatformRepoSecretEvent"

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
