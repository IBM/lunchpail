import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { Fragment, Suspense, lazy, useCallback, useEffect, useState } from "react"
const Modal = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.Modal })))

import names, { subtitles } from "../names"
import { currentKind } from "../navigate/kind"
import { isShowingWizard } from "../navigate/wizard"
import isShowingNewPool from "../navigate/newpool"
import navigateToHome, { navigateToWorkerPools } from "../navigate/home"

import PageWithDrawer, { closeDetailViewIfShowing, drilldownProps } from "./PageWithDrawer"

import Application from "../components/Application/Card"
import DataSet from "../components/DataSet/Card"
import WorkerPool from "../components/WorkerPool/Card"
import JobManagerCard from "../components/JobManager/Card"

import Sidebar from "../sidebar"
import Gallery from "../components/Gallery"
import NewWorkerPoolCard from "../components/WorkerPool/New/Card"

import type Kind from "../Kind"

import type EventSourceLike from "@jay/common/events/EventSourceLike"
import type { Handler, EventLike } from "@jay/common/events/EventSourceLike"
import type QueueEvent from "@jay/common/events/QueueEvent"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"
import type WorkerPoolStatusEvent from "@jay/common/events/WorkerPoolStatusEvent"
import type PlatformRepoSecretEvent from "@jay/common/events/PlatformRepoSecretEvent"
import type TaskSimulatorEvent from "@jay/common/events/TaskSimulatorEvent"
import type DataSetEvent from "@jay/common/events/DataSetEvent"
import type { WorkerPoolModel, WorkerPoolModelWithHistory } from "../components/WorkerPoolModel"

// strange: in non-demo mode, FilterChips stays stuck in the Suspense
// const FilterChips = lazy(() => import("../components/FilterChips"))
const NewWorkerPoolWizard = lazy(() => import("../components/WorkerPool/New/Wizard"))
const NewRepoSecretWizard = lazy(() => import("../components/PlatformRepoSecret/New/Wizard"))

import "./Dashboard.scss"

/** one EventSource per resource Kind */
export type EventProps<Source extends EventSourceLike = EventSourceLike> = Record<Kind, Source>

type Props = EventProps

function either<T>(x: T | undefined, y: T): T {
  return x === undefined ? y : x
}

export function Dashboard(props: Props) {
  /** Events for DataSets, indexed by DataSetEvent.label */
  const [datasetEvents, setDatasetEvents] = useState<Record<string, DataSetEvent[]>>({})

  /** Events for Queues, indexed by WorkerPoolModel.label */
  const [queueEvents, setQueueEvents] = useState<Record<string, QueueEvent[]>>({})

  /** Events for PlatformRepoSecrets, indexed by PlatformRepoSecretEvent.name */
  const [platformreposecretEvents, setPlatformreposecretEvents] = useState<Record<string, PlatformRepoSecretEvent[]>>(
    {},
  )

  /** Events for TaskSimulators, indexed by TaskSimulatorEvent.name */
  const [tasksimulatorEvents, setTaskSimulatorEvents] = useState<Record<string, TaskSimulatorEvent[]>>({})

  /** Events for Pools, indexed by WorkerPoolModel.label */
  const [poolEvents, setPoolEvents] = useState<Record<string, WorkerPoolStatusEvent[]>>({})

  /** Latest relationship between DataSet and WorkerPoolStatusEvent */
  const [datasetToPool, setDataSetToPool] = useState<Record<string, WorkerPoolStatusEvent[]>>({})

  /** Latest relationship between DataSet and TaskSimulatorEvent */
  const [datasetToTaskSimulators, setDataSetToTaskSimulators] = useState<Record<string, TaskSimulatorEvent[]>>({})

  /** Latest event for each Application */
  const [latestApplicationEvents, setLatestApplicationEvents] = useState<ApplicationSpecEvent[]>([])

  /** Map DataSetEvent.label to a dense index */
  const [datasetIndex, setDatasetIndex] = useState<Record<string, number>>({})

  /** Map WorkerPool label to a dense index */
  const [workerpoolIndex, setWorkerPoolIndex] = useState<Record<string, number>>({})

  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const returnHome = useCallback(
    () => navigateToHome({ location, navigate, searchParams }),
    [location, navigate, searchParams],
  )
  const returnToWorkerPools = useCallback(
    () => navigateToWorkerPools({ location, navigate, searchParams }),
    [location, navigate, searchParams],
  )

  const onDataSetEvent = useCallback(
    (evt: EventLike) => {
      const datasetEvent = JSON.parse(evt.data) as DataSetEvent
      const { label } = datasetEvent

      if (datasetEvent.status === "Terminating") {
        closeDetailViewIfShowing(label, "datasets", returnHome)

        delete datasetIndex[label]
        delete datasetEvents[label]
      } else {
        let myIdx = datasetIndex[label]
        if (myIdx === undefined) {
          myIdx = either(datasetEvent.idx, Object.keys(datasetIndex).length)
          datasetIndex[label] = myIdx
        }

        if (!(label in datasetEvents)) {
          datasetEvents[label] = []
        }
        datasetEvents[label].push(datasetEvent)
      }

      setDatasetIndex(Object.assign({}, datasetIndex))
      setDatasetEvents(Object.assign({}, datasetEvents))
    },
    [searchParams],
  )

  const onQueueEvent = useCallback(
    (evt: EventLike) => {
      const queueEvent = JSON.parse(evt.data) as QueueEvent
      const { workerpool } = queueEvent

      let myIdx = workerpoolIndex[workerpool]
      if (myIdx === undefined) {
        myIdx = Object.keys(workerpoolIndex).length
        workerpoolIndex[workerpool] = myIdx
      }

      if (!(workerpool in queueEvents)) {
        queueEvents[workerpool] = []
      }

      const myEvents = queueEvents[workerpool]
      if (myEvents.length > 0 && myEvents[myEvents.length - 1].timestamp === queueEvent.timestamp) {
        // hmm, debounce
        return
      }

      queueEvents[workerpool].push(queueEvent)

      setQueueEvents(Object.assign({}, queueEvents))
      setWorkerPoolIndex(Object.assign({}, workerpoolIndex))
    },
    [searchParams],
  )

  const onPlatformRepoSecretEvent = useCallback(
    (evt: EventLike) => {
      const event = JSON.parse(evt.data) as PlatformRepoSecretEvent

      setPlatformreposecretEvents((platformreposecretEvents) => {
        if (event.status === "Terminating") {
          closeDetailViewIfShowing(event.name, "platformreposecrets", returnHome)
          delete platformreposecretEvents[event.name]
        } else {
          if (!platformreposecretEvents[event.name]) {
            platformreposecretEvents[event.name] = []
          }
          platformreposecretEvents[event.name].push(event)
        }

        return Object.assign({}, platformreposecretEvents)
      })
    },
    [searchParams],
  )

  const onTaskSimulatorEvent = useCallback(
    (evt: EventLike) => {
      const event = JSON.parse(evt.data) as TaskSimulatorEvent

      if (event.status === "Terminating") {
        // closeDetailViewIfShowing(event.name, "tasksimulators", returnHome)

        if (datasetToTaskSimulators[event.dataset]) {
          datasetToTaskSimulators[event.dataset] = datasetToTaskSimulators[event.dataset].filter(
            (_) => _.name !== event.name,
          )
        }

        delete tasksimulatorEvents[event.name]
      } else {
        if (!tasksimulatorEvents[event.name]) {
          tasksimulatorEvents[event.name] = []
        }
        tasksimulatorEvents[event.name].push(event)

        if (!datasetToTaskSimulators[event.dataset]) {
          datasetToTaskSimulators[event.dataset] = [event]
        } else {
          const idx = datasetToTaskSimulators[event.dataset].findIndex((_) => _.name === event.name)
          if (idx < 0) {
            datasetToTaskSimulators[event.dataset].push(event)
          } else {
            datasetToTaskSimulators[event.dataset][idx] = event
          }
        }
      }

      setTaskSimulatorEvents(Object.assign({}, tasksimulatorEvents))
      setDataSetToTaskSimulators(Object.assign({}, datasetToTaskSimulators))
    },
    [searchParams],
  )

  const onPoolEvent = useCallback(
    (evt: EventLike) => {
      const poolEvent = JSON.parse(evt.data) as WorkerPoolStatusEvent

      if (poolEvent.status === "Terminating") {
        closeDetailViewIfShowing(poolEvent.workerpool, "workerpools", returnHome)
        delete poolEvents[poolEvent.workerpool]

        for (const dataset of Object.keys(datasetToPool)) {
          datasetToPool[dataset] = datasetToPool[dataset].filter((_) => _.workerpool !== poolEvent.workerpool)
        }

        setPoolEvents(Object.assign({}, poolEvents))
        setDataSetToPool(Object.assign({}, datasetToPool))
      } else if (!(poolEvent.workerpool in poolEvents)) {
        poolEvents[poolEvent.workerpool] = []
      }

      const events = poolEvents[poolEvent.workerpool]
      if (events.length === 0 || events[events.length - 1] !== poolEvent) {
        // weird debounce
        poolEvents[poolEvent.workerpool].push(poolEvent)
      }

      // keep track of the relationship between DataSet and
      // WorkerPools that are processing that DataSet
      poolEvent.datasets.forEach((dataset) => {
        if (!datasetToPool[dataset]) {
          datasetToPool[dataset] = []
        }
        // idx: index of this event's workerpool in the model for this dataset
        const idx = datasetToPool[dataset].findIndex((_) => _.workerpool === poolEvent.workerpool)
        if (idx < 0) {
          datasetToPool[dataset].push(poolEvent)
        } else {
          datasetToPool[dataset][idx] = poolEvent
        }
      })

      setPoolEvents(Object.assign({}, poolEvents))
      setDataSetToPool(Object.assign({}, datasetToPool))
    },
    [searchParams],
  )

  const onApplicationEvent = useCallback(
    (evt: EventLike) => {
      const applicationEvent = JSON.parse(evt.data) as ApplicationSpecEvent

      setLatestApplicationEvents((latestApplicationEvents) => {
        if (applicationEvent.status === "Terminating") {
          // this Application has been deleted
          closeDetailViewIfShowing(applicationEvent.application, "applications", returnHome)

          const foundIdx = latestApplicationEvents.findIndex((_) => _.application === applicationEvent.application)
          if (foundIdx >= 0) {
            latestApplicationEvents.splice(foundIdx, 1)
          }
        } else if (latestApplicationEvents.length === 0) {
          return [applicationEvent]
        } else {
          const idx = latestApplicationEvents.findIndex((_) => _.application === applicationEvent.application)
          if (idx < 0) {
            latestApplicationEvents.push(applicationEvent)
          } else {
            latestApplicationEvents[idx] = applicationEvent
          }
        }

        return latestApplicationEvents.slice()
      })
    },
    [searchParams],
  )

  function initEventStream(source: EventSourceLike, handler: Handler) {
    source.addEventListener("message", handler, false)
    // source.addEventListener("error", console.error) // TODO
  }

  function initEventStreams() {
    initEventStream(props.queues, onQueueEvent)
    initEventStream(props.datasets, onDataSetEvent)
    initEventStream(props.workerpools, onPoolEvent)
    initEventStream(props.applications, onApplicationEvent)
    initEventStream(props.platformreposecrets, onPlatformRepoSecretEvent)
    initEventStream(props.tasksimulators, onTaskSimulatorEvent)

    // return a cleanup function
    return () => {
      props.datasets.removeEventListener("message", onDataSetEvent)
      props.queues.removeEventListener("message", onQueueEvent)
      props.workerpools.removeEventListener("message", onPoolEvent)
      props.applications.removeEventListener("message", onApplicationEvent)
      props.platformreposecrets.removeEventListener("message", onPlatformRepoSecretEvent)
      props.tasksimulators.removeEventListener("message", onTaskSimulatorEvent)
    }
  }

  // this registers what is in effect a componentDidMount handler
  useEffect(initEventStreams, [])

  const lexico = (a: [string, unknown], b: [string, unknown]) => a[0].localeCompare(b[0])
  const lexicoApp = (a: ApplicationSpecEvent, b: ApplicationSpecEvent) => a.application.localeCompare(b.application)
  const lexicoWP = (a: WorkerPoolModel, b: WorkerPoolModel) => a.label.localeCompare(b.label)

  function applications() {
    return latestApplicationEvents
      .sort(lexicoApp)
      .map((evt) => <Application key={evt.application} {...evt} {...drilldownProps()} />)
  }

  function datasets() {
    return [
      ...Object.entries(datasetEvents)
        .sort(lexico)
        .map(([label, events], idx) => (
          <DataSet
            key={label}
            idx={either(events[events.length - 1].idx, idx)}
            workerpools={datasetToPool[label] || []}
            tasksimulators={datasetToTaskSimulators[label] || []}
            applications={latestApplicationEvents}
            label={label}
            events={events}
            numEvents={events.length}
            datasetIndex={datasetIndex}
            {...drilldownProps()}
          />
        )),
    ]
  }

  function toWorkerPoolModel(
    pool: WorkerPoolStatusEvent,
    queueEventsForOneWorkerPool: QueueEvent[] = [],
  ): WorkerPoolModelWithHistory {
    const model = queueEventsForOneWorkerPool.reduce(
      (M, queueEvent) => {
        if (!M.inbox[queueEvent.workerIndex]) {
          M.inbox[queueEvent.workerIndex] = {}
        }
        M.inbox[queueEvent.workerIndex][queueEvent.dataset] = queueEvent.inbox

        if (!M.outbox[queueEvent.workerIndex]) {
          M.outbox[queueEvent.workerIndex] = {}
        }
        M.outbox[queueEvent.workerIndex][queueEvent.dataset] = queueEvent.outbox

        if (!M.processing[queueEvent.workerIndex]) {
          M.processing[queueEvent.workerIndex] = {}
        }
        M.processing[queueEvent.workerIndex][queueEvent.dataset] = queueEvent.processing

        return M
      },
      { inbox: [], outbox: [], processing: [] } as Omit<WorkerPoolModel, "label" | "namespace">,
    )

    return {
      label: pool.workerpool,
      namespace: pool.namespace,
      inbox: backfill(model.inbox),
      outbox: backfill(model.outbox),
      processing: backfill(model.processing),
      events: queueEventsForOneWorkerPool,
      numEvents: queueEventsForOneWorkerPool.length,
    }
  }

  function backfill<T extends WorkerPoolModel["inbox"] | WorkerPoolModel["outbox"] | WorkerPoolModel["processing"]>(
    A: T,
  ): T {
    for (let idx = 0; idx < A.length; idx++) {
      if (!(idx in A)) A[idx] = {}
    }
    return A
  }

  const latestWorkerPoolModel: WorkerPoolModelWithHistory[] = Object.values(poolEvents)
    .filter((poolEventsForOneWorkerPool) => poolEventsForOneWorkerPool.length > 0)
    .map((poolEventsForOneWorkerPool) => {
      const pool = poolEventsForOneWorkerPool[poolEventsForOneWorkerPool.length - 1]
      const queueEventsForOneWorkerPool = queueEvents[pool.workerpool]
      return toWorkerPoolModel(pool, queueEventsForOneWorkerPool)
    })
    .sort(lexicoWP)

  const applicationsList: string[] = latestApplicationEvents.map((_) => _.application)
  const datasetsList: string[] = Object.keys(datasetIndex)
  const workerpoolsList: string[] = latestWorkerPoolModel.map((_) => _.label)
  const platformRepoSecretsList: string[] = Object.keys(platformreposecretEvents)

  function platformreposecrets() {
    return [
      ...Object.values(platformreposecretEvents)
        .filter((events) => events.length > 0)
        .map((events) => events[events.length - 1].name),
    ]
  }

  function workerpools() {
    return [
      <NewWorkerPoolCard key="new-worker-pool-card" />,
      ...latestWorkerPoolModel.map((w) => (
        <WorkerPool
          key={w.label}
          model={w}
          datasetIndex={datasetIndex}
          statusHistory={poolEvents[w.label] || []}
          {...drilldownProps()}
        />
      )),
    ]
  }

  const sidebar = (
    <Sidebar
      applications={applicationsList}
      datasets={datasetsList}
      workerpools={workerpoolsList}
      platformreposecrets={platformRepoSecretsList}
    />
  )

  const title = names[currentKind()]
  const subtitle = subtitles[currentKind()]

  function galleryItems() {
    switch (currentKind()) {
      case "controlplane":
        return <JobManagerCard {...drilldownProps()} />
      case "applications":
        return applications()
      case "datasets":
        return datasets()
      case "workerpools":
        return workerpools()
      case "platformreposecrets":
        return platformreposecrets()
    }
  }

  function MainContentBody() {
    return <Gallery>{galleryItems()}</Gallery>
  }

  const modal = (
    <Suspense fallback={<Fragment />}>
      <Modal
        variant="large"
        showClose={false}
        hasNoBodyWrapper
        aria-label="wizard-modal"
        onEscapePress={returnHome}
        isOpen={isShowingWizard()}
      >
        {isShowingNewPool() ? (
          <NewWorkerPoolWizard
            onSuccess={returnToWorkerPools}
            onCancel={returnHome}
            applications={latestApplicationEvents}
            datasets={datasetsList}
          />
        ) : (
          <NewRepoSecretWizard
            repo={searchParams.get("repo")}
            namespace={searchParams.get("namespace") || "default"}
            onSuccess={returnToWorkerPools}
            onCancel={returnHome}
          />
        )}
      </Modal>
    </Suspense>
  )

  function getApplication(id: string): ApplicationSpecEvent | undefined {
    return latestApplicationEvents.find((_) => _.application === id)
  }

  function getDataSet(id: string) {
    const events = datasetEvents[id]
    return !events || events.length === 0
      ? undefined
      : {
          idx: either(events[events.length - 1].idx, datasetIndex[id]),
          workerpools: datasetToPool[id] || [],
          tasksimulators: datasetToTaskSimulators[id] || [],
          applications: latestApplicationEvents || [],
          label: id,
          events: events,
          numEvents: events.length,
          datasetIndex: datasetIndex,
        }
  }

  function getWorkerPool(id: string) {
    const model = latestWorkerPoolModel.find((_) => _.label === id)
    return !model
      ? undefined
      : {
          model,
          statusHistory: poolEvents[id] || [],
          datasetIndex: datasetIndex,
        }
  }

  const pwdProps = { getApplication, getDataSet, getWorkerPool, modal, sidebar, subtitle, title }
  return (
    <PageWithDrawer {...pwdProps}>
      <MainContentBody />
    </PageWithDrawer>
  )
}
