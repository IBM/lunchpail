import type Memos from "../../memos"
import type ManagedEvents from "../../ManagedEvent"
import type { CurrentSettings } from "../../../Settings"

type Props = Pick<Memos, "taskqueueIndex" | "latestWorkerPoolModels"> &
  Pick<ManagedEvents, "workerpools" | "datasets" | "taskqueues" | "tasksimulators"> & {
    /** Application model */
    application: ManagedEvents["applications"][number]
  }

export type DetailProps = Props & { settings: CurrentSettings }

export default Props
