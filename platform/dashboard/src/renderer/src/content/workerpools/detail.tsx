import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
import WorkerPoolDetail from "./components/Detail"

export default function Detail(id: string, context: string, events: ManagedEvents, { latestWorkerPoolModels }: Memos) {
  const model = latestWorkerPoolModels.find((_) => _.label === id && (!context || _.context === context))
  if (!model) {
    return undefined
  } else {
    const props = {
      model,
      status: events.workerpools.find((_) => _.metadata.name === id),
    }
    return { body: <WorkerPoolDetail {...props} /> }
  }
}
