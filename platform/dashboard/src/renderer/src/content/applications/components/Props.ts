import type Memos from "../../memos"
import type ManagedEvents from "../../ManagedEvent"
import type { CurrentSettings } from "../../../Settings"

type Props = Pick<ManagedEvents, "workerpools" | "datasets" | "taskqueues" | "tasksimulators"> & {
  /** Memos to help with the UI */
  memos: Memos

  /** Application model */
  application: ManagedEvents["applications"][number]
}

export type DetailProps = Props & { settings: CurrentSettings }

export default Props
