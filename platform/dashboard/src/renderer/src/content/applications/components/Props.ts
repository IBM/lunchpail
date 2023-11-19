import type Memos from "../../memos"
import type ManagedEvents from "../../ManagedEvent"
import type { CurrentSettings } from "../../../Settings"

type Props = Pick<Memos, "taskqueueIndex" | "latestWorkerPoolModels"> &
  Pick<ManagedEvents, "workerpools" | "datasets" | "taskqueues" | "workdispatchers"> & {
    /** Application model */
    application: ManagedEvents["applications"][number]

    settings: CurrentSettings
  }

export default Props
