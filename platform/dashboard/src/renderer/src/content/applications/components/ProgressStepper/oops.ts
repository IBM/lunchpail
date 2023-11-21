import { groupSingular as singular } from "../../group"

/** An internal error has resulted in an Application with no TaskQueue */
export const oopsNoQueue = `Configuration error: no queue is associated with this ${singular}`
