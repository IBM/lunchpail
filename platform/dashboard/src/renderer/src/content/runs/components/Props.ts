import type Memos from "../../memos"
import type ManagedEvents from "../../ManagedEvent"
import type { CurrentSettings } from "../../../Settings"

type Props = Pick<Memos, "latestWorkerPoolModels"> &
  Pick<ManagedEvents, "workerpools" | "datasets" | "taskqueues" | "workdispatchers"> & {
    /** Run model */
    run: ManagedEvents["runs"][number]

    /** Application model */
    application: ManagedEvents["applications"][number]

    settings: CurrentSettings
  }

export type PropsWithPotentiallyMissingApplication = Partial<Pick<Props, "application">> & Omit<Props, "application">

export default Props
