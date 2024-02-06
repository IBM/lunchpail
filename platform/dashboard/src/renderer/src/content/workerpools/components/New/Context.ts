import type Props from "./Props"
import type { TileOptions } from "@jaas/components/Forms/Tiles"

/** Data that we want the Wizard UI to access */
type Context = Pick<Props, "runs" | "computetargets"> & {
  targetOptions: TileOptions
}

export default Context
