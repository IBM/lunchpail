import queueState from "./queues/state"
import datasetsState from "./datasets/state"
import taskqueuesState from "./taskqueues/state"
import workerpoolsState from "./workerpools/state"
import applicationsState from "./applications/state"
import tasksimulatorState from "./tasksimulators/state"
import platformreposecretState from "./platformreposecrets/state"

import type WatchedKind from "@jay/common/Kind"
import type ManagedEvents from "./ManagedEvent"
import type { EventLike } from "@jay/common/events/EventSourceLike"

import { returnHomeCallback } from "../navigate/home"

import singletonEventHandler from "../events/singleton"
import { allEventsHandler, allTimestampedEventsHandler } from "../events/all"

/*type ManagedState = {
  [Kind in WatchedKind]: [ManagedEvent<Kind>[], Dispatch<SetStateAction<ManagedEvent<Kind>[]>>]
}*/

export default function initState() {
  const queues = queueState()
  const datasets = datasetsState()
  const taskqueues = taskqueuesState()
  const workerpools = workerpoolsState()
  const applications = applicationsState()
  const tasksimulators = tasksimulatorState()
  const platformreposecrets = platformreposecretState()

  const events: ManagedEvents = {
    taskqueues: taskqueues[0],
    datasets: datasets[0],
    queues: queues[0],
    workerpools: workerpools[0],
    applications: applications[0],
    platformreposecrets: platformreposecrets[0],
    tasksimulators: tasksimulators[0],
  }

  const returnHome = returnHomeCallback()

  /** Event handlers */
  const handlers: Record<WatchedKind, (evt: EventLike) => void> = {
    applications: singletonEventHandler("applications", applications[1], returnHome),
    taskqueues: allEventsHandler(taskqueues[1]),
    datasets: singletonEventHandler("datasets", datasets[1], returnHome),
    queues: allTimestampedEventsHandler(queues[1]),
    workerpools: singletonEventHandler("workerpools", workerpools[1], returnHome),
    tasksimulators: singletonEventHandler("tasksimulators", tasksimulators[1], returnHome),
    platformreposecrets: singletonEventHandler("platformreposecrets", platformreposecrets[1], returnHome),
  }

  return { events, handlers }
}
