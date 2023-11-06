import { lazy } from "react"

import WorkerPoolCard from "./components/Card"
import WorkerPoolDetail from "./components/Detail"
const NewWorkerPoolWizard = lazy(() => import("./components/New/Wizard"))

import { name, singular } from "./name"
import { name as taskqueuesName } from "../taskqueues/name"

import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
import type ContentProvider from "../ContentProvider"

const workerpools: ContentProvider = {
  name,

  singular,

  description: (
    <span>
      The registered compute pools in your system. Each <strong>Worker Pool</strong> is a set of workers that can
      process tasks from one or more {taskqueuesName}.
    </span>
  ),

  gallery: (events: ManagedEvents, { taskqueueIndex, latestWorkerPoolModels }: Memos) => {
    return latestWorkerPoolModels.map((w) => (
      <WorkerPoolCard
        key={w.label}
        model={w}
        taskqueueIndex={taskqueueIndex}
        status={events.workerpools.find((_) => _.metadata.name === w.label)}
      />
    ))
  },

  detail: (id: string, events: ManagedEvents, { taskqueueIndex, latestWorkerPoolModels }: Memos) => {
    const model = latestWorkerPoolModels.find((_) => _.label === id)
    if (!model) {
      return undefined
    } else {
      const props = {
        model,
        status: events.workerpools.find((_) => _.metadata.name === id),
        taskqueueIndex: taskqueueIndex,
      }
      return WorkerPoolDetail(props)
    }
  },

  wizard: (events: ManagedEvents) => (
    <NewWorkerPoolWizard taskqueues={events.taskqueues} applications={events.applications} />
  ),
}

export default workerpools
