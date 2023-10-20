import md5 from "md5"
import { Fragment, ReactNode, Suspense, lazy } from "react"
import { Gallery } from "@patternfly/react-core"
const Modal = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.Modal })))

import names, { subtitles } from "../names"
import { currentKind } from "../navigate/kind"
import { isShowingWizard } from "../navigate/wizard"
import isShowingNewPool from "../navigate/newpool"
import BaseWithDrawer, { BaseWithDrawerState } from "./BaseWithDrawer"

import Welcome from "../components/Welcome"
import Application from "../components/Application/Card"
import DataSet from "../components/DataSet/Card"
import WorkerPool from "../components/WorkerPool/Card"

import Sidebar from "../sidebar"
import NewWorkerPoolCard from "../components/WorkerPool/New/Card"

import type Kind from "../Kind"
import type { LocationProps } from "../router/withLocation"

import type CreateResourceHandler from "@jaas/common/events/NewPoolHandler"
import type EventSourceLike from "@jaas/common/events/EventSourceLike"
import type { Handler, EventLike } from "@jaas/common/events/EventSourceLike"
import type QueueEvent from "@jaas/common/events/QueueEvent"
import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"
import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"
import type PlatformRepoSecretEvent from "@jaas/common/events/PlatformRepoSecretEvent"
import type DataSetEvent from "@jaas/common/events/DataSetEvent"
import type { WorkerPoolModel, WorkerPoolModelWithHistory } from "../components/WorkerPoolModel"

import { ActiveFilters, ActiveFitlersCtx } from "../context/FiltersContext"

// strange: in non-demo mode, FilterChips stays stuck in the Suspense
const FilterChips = lazy(() => import("../components/FilterChips"))
const NewWorkerPoolWizard = lazy(() => import("../components/WorkerPool/New/Wizard"))
const NewRepoSecretWizard = lazy(() => import("../components/PlatformRepoSecret/New/Wizard"))

import "./Dashboard.scss"

/** one EventSource per resource Kind */
export type EventProps<Source extends EventSourceLike = EventSourceLike> = Record<Kind, Source>

type Props = LocationProps &
  EventProps & {
    /** Handler for NewWorkerPool */
    createResource: CreateResourceHandler
  }

type State = BaseWithDrawerState & {
  /** Events for DataSets, indexed by DataSetEvent.label */
  datasetEvents: Record<string, DataSetEvent[]>

  /** Events for Queues, indexed by WorkerPoolModel.label */
  queueEvents: Record<string, QueueEvent[]>

  /** Events for PlatformRepoSecrets, indexed by PlatformRepoSecretEvent.name */
  platformreposecretEvents: Record<string, PlatformRepoSecretEvent[]>

  /** Events for Pools, indexed by WorkerPoolModel.label */
  poolEvents: Record<string, WorkerPoolStatusEvent[]>

  /** Latest relationship between DataSet and WorkerPoolStatusEvent */
  datasetToPool: Record<string, WorkerPoolStatusEvent[]>

  /** Latest event for each Application */
  latestApplicationEvents: ApplicationSpecEvent[]

  /** Latest name of ech Application, parallel to `latestApplicationEvents` */
  latestApplicationNames: string[]

  /** md5 sum of latestApplicationEvents */
  appMd5: string

  /** Map DataSetEvent.label to a dense index */
  datasetIndex: Record<string, number>

  /** Map WorkerPool label to a dense index */
  workerpoolIndex: Record<string, number>

  /** State of active filters */
  filterState: ActiveFilters
}

function either<T>(x: T | undefined, y: T): T {
  return x === undefined ? y : x
}

export class Dashboard extends BaseWithDrawer<Props, State> {
  private readonly onDataSetEvent = (evt: EventLike) => {
    const datasetEvent = JSON.parse(evt.data) as DataSetEvent
    const { label } = datasetEvent

    const datasetIndex = this.state?.datasetIndex || {}

    if (datasetEvent.status === "Terminating") {
      this.closeDetailViewIfShowing(label, "datasets")

      return this.setState((curState) => {
        delete curState?.datasetIndex[label]
        delete curState?.datasetEvents[label]
        return {
          datasetIndex,
          datasetEvents: Object.assign({}, curState?.datasetEvents),
        }
      })
    }

    let myIdx = datasetIndex[label]
    if (myIdx === undefined) {
      myIdx = either(datasetEvent.idx, Object.keys(datasetIndex).length)
      datasetIndex[label] = myIdx
    }

    const datasetEvents = Object.assign({}, this.state?.datasetEvents || {})
    if (!(label in datasetEvents)) {
      datasetEvents[label] = []
    }
    datasetEvents[label].push(datasetEvent)

    this.setState({ datasetEvents, datasetIndex })
  }

  private readonly onQueueEvent = (evt: EventLike) => {
    const queueEvent = JSON.parse(evt.data) as QueueEvent
    const { workerpool } = queueEvent

    const workerpoolIndex = this.state?.workerpoolIndex || {}
    let myIdx = workerpoolIndex[workerpool]
    if (myIdx === undefined) {
      myIdx = Object.keys(workerpoolIndex).length
      workerpoolIndex[workerpool] = myIdx
    }

    const queueEvents = Object.assign({}, this.state?.queueEvents || {})
    if (!(workerpool in queueEvents)) {
      queueEvents[workerpool] = []
    }

    const myEvents = queueEvents[workerpool]
    if (myEvents.length > 0 && myEvents[myEvents.length - 1].timestamp === queueEvent.timestamp) {
      // hmm, debounce
      return
    }

    queueEvents[workerpool].push(queueEvent)

    this.setState({ queueEvents, workerpoolIndex })
  }

  private readonly onPlatformRepoSecretEvent = (evt: EventLike) => {
    const event = JSON.parse(evt.data) as PlatformRepoSecretEvent

    this.setState((curState) => {
      if (event.status === "Terminating") {
        this.closeDetailViewIfShowing(event.name, "platformreposecrets")
        delete curState.platformreposecretEvents[event.name]
      } else {
        if (!curState.platformreposecretEvents[event.name]) {
          curState.platformreposecretEvents[event.name] = []
        }
        curState.platformreposecretEvents[event.name].push(event)
      }

      return {
        platformreposecretEvents: Object.assign({}, curState?.platformreposecretEvents),
      }
    })
  }

  private readonly onPoolEvent = (evt: EventLike) => {
    const poolEvent = JSON.parse(evt.data) as WorkerPoolStatusEvent

    this.setState((curState) => {
      if (poolEvent.status === "Terminating") {
        this.closeDetailViewIfShowing(poolEvent.workerpool, "workerpools")
        delete curState?.poolEvents[poolEvent.workerpool]

        for (const dataset of Object.keys(curState.datasetToPool)) {
          curState.datasetToPool[dataset] = curState.datasetToPool[dataset].filter(
            (_) => _.workerpool !== poolEvent.workerpool,
          )
        }

        return {
          poolEvents: Object.assign({}, curState?.poolEvents),
        }
      } else if (!(poolEvent.workerpool in curState.poolEvents)) {
        curState.poolEvents[poolEvent.workerpool] = []
      }

      const events = curState.poolEvents[poolEvent.workerpool]
      if (events.length === 0 || events[events.length - 1] !== poolEvent) {
        // weird debounce
        curState.poolEvents[poolEvent.workerpool].push(poolEvent)
      }

      // keep track of the relationship between DataSet and
      // WorkerPools that are processing that DataSet
      poolEvent.datasets.forEach((dataset) => {
        if (!curState.datasetToPool[dataset]) {
          curState.datasetToPool[dataset] = []
        }
        // idx: index of this event's workerpool in the model for this dataset
        const idx = curState.datasetToPool[dataset].findIndex((_) => _.workerpool === poolEvent.workerpool)
        if (idx < 0) {
          curState.datasetToPool[dataset].push(poolEvent)
        } else {
          curState.datasetToPool[dataset][idx] = poolEvent
        }
      })

      return {
        poolEvents: Object.assign({}, curState.poolEvents),
      }
    })
  }

  private md5(A: string[]): string {
    return A.map((_) => md5(_)).join("-")
  }

  private readonly onApplicationEvent = (evt: EventLike) => {
    const applicationEvent = JSON.parse(evt.data) as ApplicationSpecEvent

    this.setState((curState) => {
      if (applicationEvent.status === "Terminating") {
        // this Application has been deleted
        this.closeDetailViewIfShowing(applicationEvent.application, "applications")

        const foundIdx = curState?.latestApplicationEvents?.findIndex(
          (_) => _.application === applicationEvent.application,
        )
        if (foundIdx >= 0 && curState && curState.latestApplicationEvents) {
          curState.latestApplicationEvents.splice(foundIdx, 1)
          const latestApplicationNames = curState.latestApplicationEvents.map((_) => _.application)
          return {
            latestApplicationEvents: curState.latestApplicationEvents,
            latestApplicationNames,
            appMd5: this.md5(latestApplicationNames),
          }
        } else {
          return null
        }
      } else if (!curState.latestApplicationEvents || curState.latestApplicationEvents.length === 0) {
        const latestApplicationEvents = [applicationEvent]
        const latestApplicationNames = [applicationEvent.application]
        return { latestApplicationEvents, latestApplicationNames, appMd5: this.md5(latestApplicationNames) }
      } else {
        const idx = curState.latestApplicationEvents.findIndex((_) => _.application === applicationEvent.application)
        if (idx < 0) {
          curState.latestApplicationEvents.push(applicationEvent)
          curState.latestApplicationNames.push(applicationEvent.application)
        } else {
          curState.latestApplicationEvents[idx] = applicationEvent
          curState.latestApplicationNames[idx] = applicationEvent.application
        }

        return {
          latestApplicationEvents: curState.latestApplicationEvents,
          latestApplicationNames: curState.latestApplicationNames,
          appMd5: this.md5(curState.latestApplicationNames),
        }
      }
    })
  }

  private allBut(list: string[], dropThis: string) {
    const idx = list.indexOf(dropThis)
    if (idx >= 0) {
      return [...list.slice(0, idx), ...list.slice(idx + 1)]
    } else {
      return list
    }
  }

  private readonly addApplicationToFilter = (dsName: string) => {
    this.setState((curState) => {
      if (!curState.filterState.applications.includes(dsName)) {
        curState.filterState.applications.push(dsName)
        return { filterState: Object.assign({}, curState.filterState) }
      }
      return null
    })
  }

  private readonly addDataSetToFilter = (dsName: string) => {
    this.setState((curState) => {
      if (!curState.filterState.datasets.includes(dsName)) {
        curState.filterState.datasets.push(dsName)
        return { filterState: Object.assign({}, curState.filterState) }
      }
      return null
    })
  }

  private readonly addWorkerPoolToFilter = (wpName: string) => {
    this.setState((curState) => {
      if (!curState.filterState.workerpools.includes(wpName)) {
        curState.filterState.workerpools.push(wpName)
        return { filterState: Object.assign({}, curState.filterState) }
      }
      return null
    })
  }

  private readonly removeApplicationFromFilter = (dsName: string) => {
    this.setState((curState) => {
      const index = curState.filterState.applications.indexOf(dsName)
      if (index !== -1) {
        curState.filterState.applications.splice(index, 1)
        return { filterState: Object.assign({}, curState.filterState) }
      } else if (curState.filterState.showingAllApplications) {
        // user had previously selected ShowAll, and is now removing just one
        return {
          filterState: Object.assign({}, curState.filterState, {
            showingAllApplications: false,
            applications: this.allBut(this.applicationsList, dsName),
          }),
        }
      }

      return null
    })
  }

  private readonly removeDataSetFromFilter = (dsName: string) => {
    this.setState((curState) => {
      const index = curState.filterState.datasets.indexOf(dsName)
      if (index !== -1) {
        curState.filterState.datasets.splice(index, 1)
        return { filterState: Object.assign({}, curState.filterState) }
      } else if (curState.filterState.showingAllDataSets) {
        // user had previously selected ShowAll, and is now removing just one
        return {
          filterState: Object.assign({}, curState.filterState, {
            showingAllDataSets: false,
            datasets: this.allBut(this.datasetsList, dsName),
          }),
        }
      }

      return null
    })
  }

  private readonly removeWorkerPoolFromFilter = (wpName: string) => {
    this.setState((curState) => {
      const index = curState.filterState.workerpools.indexOf(wpName)
      if (index !== -1) {
        curState.filterState.workerpools.splice(index, 1)
        return { filterState: Object.assign({}, curState.filterState) }
      } else if (curState.filterState.showingAllWorkerPools) {
        // user had previously selected ShowAll, and is now removing just one
        return {
          filterState: Object.assign({}, curState.filterState, {
            showingAllWorkerPools: false,
            datasets: this.allBut(this.workerpoolsList, wpName),
          }),
        }
      }
      return null
    })
  }

  private readonly toggleShowAllApplications = () => {
    this.setState((curState) => ({
      filterState: Object.assign({}, curState.filterState, {
        showingAllApplications: !curState.filterState?.showingAllApplications,
        applications: curState.filterState?.showingAllApplications === false ? [] : curState.filterState?.applications,
      }),
    }))
  }

  private readonly toggleShowAllDataSets = () => {
    this.setState((curState) => ({
      filterState: Object.assign({}, curState.filterState, {
        showingAllDataSets: !curState.filterState?.showingAllDataSets,
        datasets: curState.filterState?.showingAllDataSets === false ? [] : curState.filterState?.datasets,
      }),
    }))
  }

  private readonly toggleShowAllWorkerPools = () => {
    this.setState((curState) => ({
      filterState: Object.assign({}, curState.filterState, {
        showingAllWorkerPools: !curState.filterState?.showingAllWorkerPools,
        workerpools: curState.filterState?.showingAllWorkerPools === false ? [] : curState.filterState?.workerpools,
      }),
    }))
  }

  private readonly clearAllFilters = () => {
    this.setState((curState) => {
      curState.filterState.datasets = []
      curState.filterState.workerpools = []
      return { filterState: Object.assign({}, curState.filterState) }
    })
  }

  private initEventStream(source: EventSourceLike, handler: Handler) {
    source.addEventListener("message", handler, false)
    source.addEventListener("error", console.error) // TODO
  }

  private readonly initEventStreams = () => {
    this.initEventStream(this.props.queues, this.onQueueEvent)
    this.initEventStream(this.props.datasets, this.onDataSetEvent)
    this.initEventStream(this.props.workerpools, this.onPoolEvent)
    this.initEventStream(this.props.applications, this.onApplicationEvent)
    this.initEventStream(this.props.platformreposecrets, this.onPlatformRepoSecretEvent)
  }

  public componentWillUnmount() {
    this.props.datasets.removeEventListener("message", this.onDataSetEvent)
    this.props.queues.removeEventListener("message", this.onQueueEvent)
    this.props.workerpools.removeEventListener("message", this.onPoolEvent)
    this.props.applications.removeEventListener("message", this.onApplicationEvent)
    this.props.platformreposecrets.removeEventListener("message", this.onPlatformRepoSecretEvent)
  }

  public componentDidMount() {
    this.setState({
      datasetEvents: {},
      queueEvents: {},
      platformreposecretEvents: {},
      poolEvents: {},
      datasetToPool: {},
      latestApplicationEvents: [],
      datasetIndex: {},
      workerpoolIndex: {},
      filterState: {
        applications: [],
        datasets: [],
        workerpools: [],
        showingAllApplications: false,
        showingAllDataSets: false,
        showingAllWorkerPools: false,
        addApplicationToFilter: this.addApplicationToFilter,
        addDataSetToFilter: this.addDataSetToFilter,
        addWorkerPoolToFilter: this.addWorkerPoolToFilter,
        removeApplicationFromFilter: this.removeApplicationFromFilter,
        removeDataSetFromFilter: this.removeDataSetFromFilter,
        removeWorkerPoolFromFilter: this.removeWorkerPoolFromFilter,
        toggleShowAllApplications: this.toggleShowAllApplications,
        toggleShowAllDataSets: this.toggleShowAllDataSets,
        toggleShowAllWorkerPools: this.toggleShowAllWorkerPools,
        clearAllFilters: this.clearAllFilters,
      },
    })

    this.initEventStreams()
  }

  private lexico = (a: [string, unknown], b: [string, unknown]) => a[0].localeCompare(b[0])
  private lexicoApp = (a: ApplicationSpecEvent, b: ApplicationSpecEvent) => a.application.localeCompare(b.application)
  private lexicoWP = (a: WorkerPoolModel, b: WorkerPoolModel) => a.label.localeCompare(b.label)

  /** Helpful to fix the size of the gallery nodes. Otherwise, PatternFly's Gallery gets jiggy when you open/close the drawer */
  private readonly galleryMinWidths = {
    default: "18em",
  }

  /** Helpful to fix the size of the gallery nodes. Otherwise, PatternFly's Gallery gets jiggy when you open/close the drawer */
  private readonly galleryMaxWidths = {
    default: "18em",
  }

  /** Render a PatternFly Gallery of the given nodes */
  private gallery(nodes: ReactNode[]) {
    return (
      <Gallery hasGutter minWidths={this.galleryMinWidths} maxWidths={this.galleryMaxWidths}>
        {nodes}
      </Gallery>
    )
  }

  private applications() {
    return this.gallery(
      (this.state?.latestApplicationEvents || [])
        .filter(
          (evt) =>
            !this.state?.filterState.applications.length ||
            this.state.filterState.showingAllApplications ||
            this.state.filterState.applications.includes(evt.application),
        )
        .sort(this.lexicoApp)
        .map((evt) => <Application key={evt.application} {...evt} {...this.drilldownProps()} />),
    )
  }

  private datasets() {
    return this.gallery([
      ...Object.entries(this.state?.datasetEvents || {})
        .sort(this.lexico)
        .map(
          ([label, events], idx) =>
            (!this.state?.filterState.datasets.length ||
              this.state.filterState.showingAllDataSets ||
              this.state.filterState.datasets.includes(label)) && (
              <DataSet
                key={label}
                idx={either(events[events.length - 1].idx, idx)}
                workerpools={this.state?.datasetToPool[label] || []}
                applications={this.state?.latestApplicationEvents || []}
                label={label}
                events={events}
                numEvents={events.length}
                datasetIndex={this.state.datasetIndex}
                location={this.props.location}
                searchParams={this.props.searchParams}
                {...this.drilldownProps()}
              />
            ),
        ),
    ])
  }

  private toWorkerPoolModel(
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
      inbox: this.backfill(model.inbox),
      outbox: this.backfill(model.outbox),
      processing: this.backfill(model.processing),
      events: queueEventsForOneWorkerPool,
      numEvents: queueEventsForOneWorkerPool.length,
    }
  }

  private backfill<T extends WorkerPoolModel["inbox"] | WorkerPoolModel["outbox"] | WorkerPoolModel["processing"]>(
    A: T,
  ): T {
    for (let idx = 0; idx < A.length; idx++) {
      if (!(idx in A)) A[idx] = {}
    }
    return A
  }

  private get applicationsList(): string[] {
    return this.state?.latestApplicationNames || []
  }

  private get datasetsList(): string[] {
    return Object.keys(this.state?.datasetIndex || {})
  }

  private get workerpoolsList(): string[] {
    return this.latestWorkerPoolModel.map((_) => _.label)
  }

  private get platformRepoSecretsList(): string[] {
    return Object.keys(this.state?.platformreposecretEvents || {})
  }

  private get latestWorkerPoolModel(): WorkerPoolModelWithHistory[] {
    return Object.values(this.state?.poolEvents || {})
      .filter((poolEventsForOneWorkerPool) => poolEventsForOneWorkerPool.length > 0)
      .map((poolEventsForOneWorkerPool) => {
        const pool = poolEventsForOneWorkerPool[poolEventsForOneWorkerPool.length - 1]
        const queueEventsForOneWorkerPool = this.state?.queueEvents[pool.workerpool]
        return this.toWorkerPoolModel(pool, queueEventsForOneWorkerPool)
      })
      .sort(this.lexicoWP)
  }

  private platformreposecrets() {
    return this.gallery([
      ...Object.values(this.state?.platformreposecretEvents || {})
        .filter((events) => events.length > 0)
        .map((events) => events[events.length - 1].name),
    ])
  }

  private workerpools() {
    return this.gallery([
      <NewWorkerPoolCard
        key="new-worker-pool-card"
        location={this.props.location}
        searchParams={this.props.searchParams}
      />,
      ...this.latestWorkerPoolModel.map(
        (w) =>
          (!this.state?.filterState.workerpools.length ||
            this.state.filterState.showingAllWorkerPools ||
            this.state?.filterState.workerpools.includes(w.label)) && (
            <WorkerPool
              key={w.label}
              model={w}
              datasetIndex={this.state.datasetIndex}
              statusHistory={this.state.poolEvents[w.label] || []}
              {...this.drilldownProps()}
            />
          ),
      ),
    ])
  }

  protected override sidebar() {
    return (
      <Sidebar
        filterState={this.state?.filterState}
        appMd5={this.state?.appMd5}
        applications={this.applicationsList}
        datasets={this.datasetsList}
        workerpools={this.workerpoolsList}
        platformreposecrets={this.platformRepoSecretsList}
        location={this.props.location}
      />
    )
  }

  private get hasFilters() {
    return (
      this.state?.filterState &&
      (this.state.filterState.showingAllApplications ||
        this.state.filterState.showingAllDataSets ||
        this.state.filterState.showingAllWorkerPools ||
        this.state.filterState.applications.length > 0 ||
        this.state.filterState.datasets.length > 0 ||
        this.state.filterState.workerpools.length > 0)
    )
  }

  protected override chips() {
    return (
      this.hasFilters && (
        <Suspense fallback={<Fragment />}>
          <ActiveFitlersCtx.Provider value={this.state?.filterState}>
            <FilterChips
              applications={
                this.state?.filterState.showingAllApplications
                  ? this.applicationsList
                  : this.state?.filterState.applications
              }
              datasets={
                this.state?.filterState.showingAllDataSets ? this.datasetsList : this.state?.filterState.datasets
              }
              workerpools={
                this.state?.filterState.showingAllWorkerPools
                  ? this.workerpoolsList
                  : this.state?.filterState.workerpools
              }
            />
          </ActiveFitlersCtx.Provider>
        </Suspense>
      )
    )
  }

  protected override title() {
    return names[currentKind(this.props)]
  }

  protected override subtitle() {
    return subtitles[currentKind(this.props)]
  }

  /** Should we *not* show the Applications panel? */
  /*private get hideApplications() {
    // if we are not showing all applications and showing all worker pools
    return (
      !this.state?.filterState.showingAllApplications &&
      this.state?.filterState.applications.length === 0 &&
      (this.state?.filterState.showingAllDataSets || this.state?.filterState.showingAllWorkerPools)
    )
  }*/

  /** Should we *not* show the DataSetss panel? */
  /*private get hideDataSets() {
    // if we are not showing all datasets and showing all worker pools
    return (
      !this.state?.filterState.showingAllDataSets &&
      this.state?.filterState.datasets.length === 0 &&
      (this.state?.filterState.showingAllApplications || this.state?.filterState.showingAllWorkerPools)
    )
  }*/

  /** Should we *not* show the WorkerPools panel? */
  /*private get hideWorkerPools() {
    // if we are showing all datasets and not showing all worker pools
    return (
      !this.state?.filterState.showingAllWorkerPools &&
      this.state?.filterState.workerpools.length === 0 &&
      (this.state?.filterState.showingAllApplications || this.state?.filterState.showingAllDataSets)
    )
  }*/

  protected override mainContentBody() {
    switch (currentKind(this.props)) {
      case "welcome":
        return (
          <Welcome
            appMd5={this.state?.appMd5}
            applications={this.state?.latestApplicationNames}
            datasets={this.datasetsList}
            workerpools={this.workerpoolsList}
          />
        )
      case "applications":
        return this.applications()
      case "datasets":
        return this.datasets()
      case "workerpools":
        return this.workerpools()
      case "platformreposecrets":
        return this.platformreposecrets()
    }
  }

  protected override modal() {
    return (
      <Suspense fallback={<Fragment />}>
        <Modal
          variant="large"
          showClose={false}
          hasNoBodyWrapper
          aria-label="wizard-modal"
          onEscapePress={this.returnHome}
          isOpen={isShowingWizard(this.props)}
        >
          {isShowingNewPool(this.props) ? (
            <NewWorkerPoolWizard
              onSuccess={this.returnToWorkerPools}
              onCancel={this.returnHome}
              appMd5={this.state?.appMd5}
              applications={this.state?.latestApplicationEvents}
              datasets={this.datasetsList}
              createResource={this.props.createResource}
              searchParams={this.props.searchParams}
            />
          ) : (
            <NewRepoSecretWizard
              repo={this.props.searchParams.get("repo")}
              namespace={this.props.searchParams.get("namespace") || "default"}
              onSuccess={this.returnToWorkerPools}
              onCancel={this.returnHome}
              createResource={this.props.createResource}
              searchParams={this.props.searchParams}
            />
          )}
        </Modal>
      </Suspense>
    )
  }

  protected override getApplication(id: string): ApplicationSpecEvent | undefined {
    return this.state?.latestApplicationEvents.find((_) => _.application === id)
  }

  protected override getDataSet(id: string) {
    const events = this.state?.datasetEvents[id]
    return !this.state || !events || events.length === 0
      ? undefined
      : {
          idx: either(events[events.length - 1].idx, this.state.datasetIndex[id]),
          workerpools: this.state?.datasetToPool[id] || [],
          applications: this.state?.latestApplicationEvents || [],
          label: id,
          events: events,
          numEvents: events.length,
          datasetIndex: this.state.datasetIndex,
        }
  }

  protected override getWorkerPool(id: string) {
    const model = this.latestWorkerPoolModel.find((_) => _.label === id)
    return !this.state || !model
      ? undefined
      : {
          model,
          statusHistory: this.state.poolEvents[id] || [],
          datasetIndex: this.state.datasetIndex,
        }
  }
}
