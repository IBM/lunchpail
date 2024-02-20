import { useMemo } from "react"

import Card from "./components/Card"
import Gallery from "@jaas/renderer/components/Gallery"

import uniqueTaskQueues from "@jaas/resources/taskqueues/unique"

// import type Memos from "../memos"
import type ManagedEvents from "../ManagedEvent"
// import type { CurrentSettings } from "@jaas/renderer/Settings"

export default function gallery(
  events: Pick<ManagedEvents, "taskqueues" | "runs"> /*, memos: Memos, settings: CurrentSettings */,
) {
  return <TaskQueuesGallery taskqueues={events.taskqueues} runs={events.runs} />
}

function TaskQueuesGallery(props: Pick<ManagedEvents, "taskqueues" | "runs">) {
  const taskqueues = useMemo(() => uniqueTaskQueues(props), [JSON.stringify(props.taskqueues)])

  return (
    <Gallery>
      {taskqueues.map((evt) => (
        <Card key={evt.metadata.name} taskqueue={evt} runs={props.runs} />
      ))}
    </Gallery>
  )
}
