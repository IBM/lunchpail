import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
import WorkerPoolDetail from "./components/Detail"

export default function Detail(id: string, events: ManagedEvents, { taskqueueIndex, latestWorkerPoolModels }: Memos) {
  const model = latestWorkerPoolModels.find((_) => _.label === id)
  if (!model) {
    return undefined
  } else {
    const props = {
      model,
      status: events.workerpools.find((_) => _.metadata.name === id),
      taskqueueIndex: taskqueueIndex,
    }
    return <WorkerPoolDetail {...props} />
  }
}
