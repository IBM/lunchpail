import { useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import names, { subtitles } from "../names"
import { currentKind } from "../navigate/kind"
import { returnHomeCallback } from "../navigate/home"

import PageWithDrawer, { drilldownProps } from "./PageWithDrawer"

import DataSet from "../components/DataSet/Card"
import WorkerPool from "../components/WorkerPool/Card"
import Application from "../components/Application/Card"
import JobManagerCard from "../components/JobManager/Card"
import PlatformRepoSecretCard from "../components/PlatformRepoSecret/Card"

import Settings from "../Settings"
import Sidebar from "../sidebar"
import Gallery from "../components/Gallery"
import DashboardModal from "./DashboardModal"

import DataSetDetail from "../components/DataSet/Detail"
import TaskQueueDetail from "../components/TaskQueue/Detail"
import WorkerPoolDetail from "../components/WorkerPool/Detail"
import ApplicationDetail from "../components/Application/Detail"
import JobManagerDetail from "../components/JobManager/Detail"
import PlatformRepoSecretDetail from "../components/PlatformRepoSecret/Detail"

import { LinkToNewDataSet } from "../components/DataSet/New/Button"
import { LinkToNewApplication } from "../components/Application/New/Button"

import singletonEventHandler from "../events/singleton"
import { allEventsHandler, allTimestampedEventsHandler } from "../events/all"

import {
  queueTaskQueue,
  queueInbox,
  queueOutbox,
  queueProcessing,
  queueWorkerIndex,
  queueWorkerPool,
} from "../events/QueueEvent"

import type Kind from "../Kind"
import type { DetailableKind } from "../Kind"
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
    queues: allTimestampedEventsHandler(setQueueEvents),
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
            M.index[event.metadata.name] = either(event.spec?.idx, M.next++)
          }
          return M
        },
        { next: 0, index: {} as Record<string, number> },
      ).index,
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

  const workerpoolCards = useMemo(
    () =>
      latestWorkerPoolModels.map((w) => (
        <WorkerPool
          key={w.label}
          model={w}
          taskqueueIndex={taskqueueIndex}
          status={poolEvents.find((_) => _.metadata.name === w.label)}
        />
      )),
    [latestWorkerPoolModels],
  )

  const sidebar = (
    <Sidebar
      applications={applicationsList}
      datasets={datasetsList}
      workerpools={workerpoolsList}
      platformreposecrets={platformRepoSecretsList}
    />
  )

  /** Helps will drilldown to Details */
  function getApplication(id: string) {
    const application = applicationEvents.find((_) => _.metadata.name === id)
    return application ? { application, datasets: datasetsList, taskqueues: taskqueuesList } : undefined
  }

  /** Helps will drilldown to Details */
  function getDataSet(id: string, datasetEvents: DataSetEvent[]) {
    return datasetEvents.find((_) => _.metadata.name === id)
  }

  /** Helps will drilldown to Details */
  function getTaskQueue(id: string) {
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
  }

  /** Helps will drilldown to Details */
  function getWorkerPool(id: string) {
    const model = latestWorkerPoolModels.find((_) => _.label === id)
    return !model
      ? undefined
      : {
          model,
          status: poolEvents.find((_) => _.metadata.name === id),
          taskqueueIndex: taskqueueIndex,
        }
  }

  const content: Record<
    DetailableKind,
    { gallery?: () => ReactNode; detail?: (id: string) => ReactNode; actions?: () => ReactNode }
  > = {
    controlplane: {
      gallery: () => <JobManagerCard />,
      detail: () => <JobManagerDetail />,
    },
    applications: {
      gallery: () =>
        applicationEvents.map((evt) => (
          <Application key={evt.metadata.name} application={evt} datasets={datasetsList} taskqueues={taskqueuesList} />
        )),
      detail: (id: string) => ApplicationDetail(getApplication(id)),
      actions: () => !inDemoMode && <LinkToNewApplication startOrAdd="add" />,
    },
    taskqueues: {
      detail: (id: string) => TaskQueueDetail(getTaskQueue(id)),
    },
    datasets: {
      gallery: () => datasetEvents.map((evt) => <DataSet key={evt.metadata.name} {...evt} />),
      detail: (id: string) => DataSetDetail(getDataSet(id, datasetEvents)),
      actions: () => !inDemoMode && <LinkToNewDataSet startOrAdd="add" />,
    },
    workerpools: {
      gallery: () => workerpoolCards,
      detail: (id: string) => WorkerPoolDetail(getWorkerPool(id)),
      // actions: () => !inDemoMode && <LinkToNewWorkerPool startOrAdd="add"/>,
    },
    platformreposecrets: {
      gallery: () =>
        platformreposecretEvents.map((props) => <PlatformRepoSecretCard key={props.metadata.name} {...props} />),
      detail: (id: string) => PlatformRepoSecretDetail(platformreposecretEvents.find((_) => _.metadata.name === id)),
    },
  }

  /** Content to display in the slide-out Drawer panel */
  const { currentlySelectedId: id, currentlySelectedKind: kind } = drilldownProps()
  const detailContentProvider = id && kind && content[kind]
  const currentDetail =
    detailContentProvider && detailContentProvider.detail ? detailContentProvider.detail(id) : undefined

  const bodyContentProvider = content[currentKind()]
  const currentActions = bodyContentProvider && bodyContentProvider.actions ? bodyContentProvider.actions() : undefined

  const pwdProps = {
    currentDetail,
    modal: <DashboardModal applications={applicationEvents} taskqueues={taskqueuesList} datasets={datasetsList} />,
    title: names[currentKind()],
    subtitle: subtitles[currentKind()],
    sidebar,
    actions: currentActions,
  }

  return (
    <PageWithDrawer {...pwdProps}>
      <Gallery>{bodyContentProvider.gallery && bodyContentProvider.gallery()}</Gallery>
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
