import { useCallback, useContext, useEffect, useMemo, useState } from "react"

import names, { subtitles } from "../names"
import { currentKind } from "../navigate/kind"
import { returnHomeCallback } from "../navigate/home"

import PageWithDrawer, { drilldownProps } from "./PageWithDrawer"

import DataSet from "../components/DataSet/Card"
import TaskQueue from "../components/TaskQueue/Card"
import WorkerPool from "../components/WorkerPool/Card"
import Application from "../components/Application/Card"
import JobManagerCard from "../components/JobManager/Card"

import Settings from "../Settings"
import Sidebar from "../sidebar"
import Gallery from "../components/Gallery"
import DashboardModal from "./DashboardModal"
import NewDataSetCards from "../components/DataSet/New/Cards"
import NewWorkerPoolCard from "../components/WorkerPool/New/Card"
import NewApplicationCard from "../components/Application/New/Card"

import DataSetDetail from "../components/DataSet/Detail"
import TaskQueueDetail from "../components/TaskQueue/Detail"
import WorkerPoolDetail from "../components/WorkerPool/Detail"
import ApplicationDetail from "../components/Application/Detail"
import JobManagerDetail from "../components/JobManager/Detail"

import allEventsHandler from "../events/all"
import singletonEventHandler from "../events/singleton"

import {
  queueTaskQueue,
  queueInbox,
  queueOutbox,
  queueProcessing,
  queueWorkerIndex,
  queueWorkerPool,
} from "../events/QueueEvent"

import type Kind from "../Kind"
import type EventSourceLike from "@jay/common/events/EventSourceLike"
import type { EventLike } from "@jay/common/events/EventSourceLike"
import type QueueEvent from "@jay/common/events/QueueEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"
import type WorkerPoolStatusEvent from "@jay/common/events/WorkerPoolStatusEvent"
import type PlatformRepoSecretEvent from "@jay/common/events/PlatformRepoSecretEvent"
import type TaskSimulatorEvent from "@jay/common/events/TaskSimulatorEvent"
import type DataSetEvent from "@jay/common/events/DataSetEvent"
import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"
import type { WorkerPoolModel, WorkerPoolModelWithHistory } from "../components/WorkerPoolModel"

import "./Dashboard.scss"

/** one EventSource per resource Kind */
export type EventProps<Source extends EventSourceLike = EventSourceLike> = Record<Kind, Source>

type Props = EventProps

function either<T>(x: T | undefined, y: T): T {
  return x === undefined ? y : x
}

export function Dashboard(props: Props) {
  const settings = useContext(Settings)
  const inDemoMode = settings?.demoMode[0] ?? false

  const returnHome = returnHomeCallback()

  // State
  const [poolEvents, setPoolEvents] = useState<WorkerPoolStatusEvent[]>([])
  const [queueEvents, setQueueEvents] = useState<QueueEvent[]>([])
  const [taskqueueEvents, setTaskQueueEvents] = useState<TaskQueueEvent[]>([])
  const [datasetEvents, setDataSetEvents] = useState<DataSetEvent[]>([])
  const [applicationEvents, setApplicationEvents] = useState<ApplicationSpecEvent[]>([])
  const [tasksimulatorEvents, setTaskSimulatorEvents] = useState<TaskSimulatorEvent[]>([])
  const [platformreposecretEvents, setPlatformRepoSecretEvents] = useState<PlatformRepoSecretEvent[]>([])

  /** Event handlers */
  const handlers: Record<Kind, (evt: EventLike) => void> = {
    applications: singletonEventHandler("applications", setApplicationEvents, returnHome),
    taskqueues: allEventsHandler(setTaskQueueEvents),
    datasets: singletonEventHandler("datasets", setDataSetEvents, returnHome),
    queues: allEventsHandler(setQueueEvents),
    workerpools: singletonEventHandler("workerpools", setPoolEvents, returnHome),
    tasksimulators: singletonEventHandler("tasksimulators", setTaskSimulatorEvents, returnHome),
    platformreposecrets: singletonEventHandler("platformreposecrets", setPlatformRepoSecretEvents, returnHome),
  }

  /** A memo of the mapping from WorkerPool to associated QueueEvents */
  const queueEventsForWorkerPool = useMemo(
    () =>
      queueEvents.reduce(
        (M, event) => {
          const workerpool = queueWorkerPool(event)
          if (!M[workerpool]) {
            M[workerpool] = []
          }
          M[workerpool].push(event)
          return M
        },
        {} as Record<string, QueueEvent[]>,
      ),
    [queueEvents],
  )

  /** A memo of the mapping from TaskQueue to TaskSimulatorEvents */
  const taskqueueToTaskSimulators = useMemo(
    () =>
      tasksimulatorEvents.reduce(
        (M, event) => {
          if (!M[event.spec.dataset]) {
            M[event.spec.dataset] = []
          }
          M[event.spec.dataset].push(event)
          return M
        },
        {} as Record<string, TaskSimulatorEvent[]>,
      ),
    [tasksimulatorEvents],
  )

  /** A memo of the mapping from TaskQueue to WorkerPools */
  const taskqueueToPool = useMemo(
    () =>
      poolEvents.reduce(
        (M, event) => {
          [event.spec.dataset].forEach((taskqueue) => {
            if (!M[taskqueue]) {
              M[taskqueue] = []
            }
            M[taskqueue].push(event)
          })
          return M
        },
        {} as Record<string, WorkerPoolStatusEvent[]>,
      ),
    [poolEvents],
  )

  /**
   * A memo of the mapping from TaskQueue to its position in the UI --
   * this helps us to keep coloring consistent across the views -- we
   * will use the index into a color lookup table in the CSS (see
   * GridCell.scss).
   */
  const taskqueueIndex = useMemo(
    () =>
      taskqueueEvents.reduce(
        (M, event) => {
          if (!(event.metadata.name in M.index)) {
            M.index[event.metadata.name] = either(event.spec.idx, M.next++)
          }
          return M
        },
        { next: 0, index: {} as Record<string, number> },
      ).index,
    [taskqueueEvents],
  )

  /**
   * The TaskQueueEvents model keeps track of all events (e.g. so we can
   * display timelines). It is helpful to memoize just the latest
   * event for each TaskQueue resource.
   */
  const latestTaskQueueEvents = useMemo(
    () =>
      Object.values(
        taskqueueEvents.reduceRight(
          (M, event) => {
            if (!(event.metadata.name in M)) {
              M[event.metadata.name] = event
            }
            return M
          },
          {} as Record<string, TaskQueueEvent>,
        ),
      ).sort((a, b) => a.metadata.name.localeCompare(b.metadata.name)),
    [taskqueueEvents],
  )

  /** A memo of the latest WorkerPoolModels, one per worker pool */
  const latestWorkerPoolModels: WorkerPoolModelWithHistory[] = useMemo(
    () =>
      poolEvents
        .map((pool) => {
          const queueEventsForOneWorkerPool = queueEventsForWorkerPool[pool.metadata.name]
          return toWorkerPoolModel(pool, queueEventsForOneWorkerPool)
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [poolEvents, queueEvents],
  )

  const applicationsList = useMemo(() => applicationEvents.map((_) => _.metadata.name), [applicationEvents])
  const datasetsList = useMemo(() => datasetEvents.map((_) => _.metadata.name), [datasetEvents])
  const taskqueuesList = useMemo(() => Object.keys(taskqueueIndex), [Object.keys(taskqueueIndex).join("-")])
  const workerpoolsList = useMemo(() => latestWorkerPoolModels.map((_) => _.label), [latestWorkerPoolModels])
  const platformRepoSecretsList = useMemo(
    () => platformreposecretEvents.map((_) => _.metadata.name),
    [platformreposecretEvents],
  )

  // this registers what is in effect a componentDidMount handler
  useEffect(function onMount() {
    Object.entries(handlers).forEach(([kind, handler]) => {
      props[kind].addEventListener("message", handler, false)
    })

    // return a cleanup function to be called when the component unmounts
    return () =>
      Object.entries(handlers).forEach(([kind, handler]) => props[kind].removeEventListener("message", handler))
  }, [])

  const drilldown = drilldownProps()

  const applicationCards = useMemo(
    () => [
      ...[inDemoMode ? [] : [<NewApplicationCard key="new-application-card" />]],
      ...applicationEvents.map((evt) => (
        <Application
          key={evt.metadata.name}
          application={evt}
          {...drilldown}
          datasets={datasetsList}
          taskqueues={taskqueuesList}
        />
      )),
    ],
    [inDemoMode, applicationEvents, drilldown],
  )

  const datasetCards = useMemo(
    () => [
      ...NewDataSetCards,
      ...datasetEvents.map((evt) => <DataSet key={evt.metadata.name} {...evt} {...drilldown} />),
    ],
    [datasetEvents.map((_) => _.metadata.name).join("-"), drilldown],
  )

  const taskqueueCards = useMemo(
    () => [
      ...latestTaskQueueEvents.map((event) => (
        <TaskQueue
          key={event.metadata.name}
          idx={either(event.spec.idx, taskqueueIndex[event.metadata.name])}
          workerpools={taskqueueToPool[event.metadata.name] || []}
          tasksimulators={taskqueueToTaskSimulators[event.metadata.name] || []}
          applications={applicationEvents}
          name={event.metadata.name}
          events={[event]}
          numEvents={1}
          taskqueueIndex={taskqueueIndex}
          {...drilldown}
        />
      )),
    ],
    [latestTaskQueueEvents, taskqueueIndex, taskqueueToPool, taskqueueToTaskSimulators],
  )

  // TODO... cards
  const platformreposecretCards = useMemo(
    () => platformreposecretEvents.map((_) => _.metadata.name),
    [platformreposecretEvents],
  )

  const workerpoolCards = useMemo(
    () => [
      <NewWorkerPoolCard key="new-workerpool-card" />,
      ...latestWorkerPoolModels.map((w) => (
        <WorkerPool
          key={w.label}
          model={w}
          taskqueueIndex={taskqueueIndex}
          status={poolEvents.find((_) => _.metadata.name === w.label)}
          {...drilldown}
        />
      )),
    ],
    [latestWorkerPoolModels],
  )

  const sidebar = (
    <Sidebar
      applications={applicationsList}
      datasets={datasetsList}
      taskqueues={taskqueuesList}
      workerpools={workerpoolsList}
      platformreposecrets={platformRepoSecretsList}
    />
  )

  function galleryItems() {
    switch (currentKind()) {
      case "controlplane":
        return <JobManagerCard {...drilldown} />
      case "applications":
        return applicationCards
      case "taskqueues":
        return taskqueueCards
      case "datasets":
        return datasetCards
      case "workerpools":
        return workerpoolCards
      case "platformreposecrets":
        return platformreposecretCards
    }
  }

  /** Helps will drilldown to Details */
  const getApplication = useCallback(
    (id: string) => {
      const application = applicationEvents.find((_) => _.metadata.name === id)
      return application ? { application, datasets: datasetsList, taskqueues: taskqueuesList } : undefined
    },
    [applicationEvents],
  )

  /** Helps will drilldown to Details */
  const getDataSet = useCallback(
    (id: string) => {
      return datasetEvents.find((_) => _.metadata.name === id)
    },
    [datasetEvents],
  )

  /** Helps will drilldown to Details */
  const getTaskQueue = useCallback(
    (id: string) => {
      const events = taskqueueEvents.filter((_) => _.metadata.name === id)
      return events.length === 0
        ? undefined
        : {
            idx: either(events[events.length - 1].spec.idx, taskqueueIndex[id]),
            workerpools: taskqueueToPool[id] || [],
            tasksimulators: taskqueueToTaskSimulators[id] || [],
            applications: applicationEvents || [],
            name: id,
            events,
            numEvents: events.length,
            taskqueueIndex,
          }
    },
    [taskqueueEvents, applicationEvents, taskqueueToTaskSimulators],
  )

  /** Helps will drilldown to Details */
  const getWorkerPool = useCallback(
    (id: string) => {
      const model = latestWorkerPoolModels.find((_) => _.label === id)
      return !model
        ? undefined
        : {
            model,
            status: poolEvents.find((_) => _.metadata.name === id),
            taskqueueIndex: taskqueueIndex,
          }
    },
    [latestWorkerPoolModels],
  )

  const { currentlySelectedId: id, currentlySelectedKind: kind } = drilldownProps()
  const currentDetail =
    id !== null && kind === "applications" ? (
      ApplicationDetail(getApplication(id))
    ) : id !== null && kind === "datasets" ? (
      DataSetDetail(getDataSet(id))
    ) : id !== null && kind === "taskqueues" ? (
      TaskQueueDetail(getTaskQueue(id))
    ) : id !== null && kind === "workerpools" ? (
      WorkerPoolDetail(getWorkerPool(id))
    ) : kind === "controlplane" ? (
      <JobManagerDetail />
    ) : undefined

  const pwdProps = {
    currentDetail,
    modal: <DashboardModal applications={applicationEvents} taskqueues={taskqueuesList} datasets={datasetsList} />,
    sidebar,
    subtitle: subtitles[currentKind()],
    title: names[currentKind()],
  }

  return (
    <PageWithDrawer {...pwdProps}>
      <Gallery>{galleryItems()}</Gallery>
    </PageWithDrawer>
  )
}

/** Used by the ugly toWorkerPoolModel. hopefully this will go away at some point */
function backfill<T extends WorkerPoolModel["inbox"] | WorkerPoolModel["outbox"] | WorkerPoolModel["processing"]>(
  A: T,
): T {
  for (let idx = 0; idx < A.length; idx++) {
    if (!(idx in A)) A[idx] = {}
  }
  return A
}

/**
 * Ugh, this is an ugly remnant of earlier models -- it helps
 * conform the clean models here to what WorkerPool card/detail
 * models need for their plots. TODO...
 */
function toWorkerPoolModel(
  pool: WorkerPoolStatusEvent,
  queueEventsForOneWorkerPool: QueueEvent[] = [],
): WorkerPoolModelWithHistory {
  const model = queueEventsForOneWorkerPool.reduce(
    (M, queueEvent) => {
      const taskqueue = queueTaskQueue(queueEvent)
      const inbox = queueInbox(queueEvent)
      const outbox = queueOutbox(queueEvent)
      const processing = queueProcessing(queueEvent)
      const workerIndex = queueWorkerIndex(queueEvent)

      if (!M.inbox[workerIndex]) {
        M.inbox[workerIndex] = {}
      }
      M.inbox[workerIndex][taskqueue] = inbox

      if (!M.outbox[workerIndex]) {
        M.outbox[workerIndex] = {}
      }
      M.outbox[workerIndex][taskqueue] = outbox

      if (!M.processing[workerIndex]) {
        M.processing[workerIndex] = {}
      }
      M.processing[workerIndex][taskqueue] = processing

      return M
    },
    { inbox: [], outbox: [], processing: [] } as Omit<WorkerPoolModel, "label" | "namespace">,
  )

  return {
    label: pool.metadata.name,
    namespace: pool.metadata.namespace,
    inbox: backfill(model.inbox),
    outbox: backfill(model.outbox),
    processing: backfill(model.processing),
    events: queueEventsForOneWorkerPool.map((_) => ({ outbox: queueOutbox(_), timestamp: _.timestamp })),
    numEvents: queueEventsForOneWorkerPool.length,
  }
}
