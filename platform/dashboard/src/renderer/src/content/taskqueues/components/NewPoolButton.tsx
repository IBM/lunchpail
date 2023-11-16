import type Props from "./Props"
import { numAssociatedApplications, numAssociatedWorkerPools } from "./common"

import { LinkToNewPool } from "@jay/renderer/navigate/newpool"

export default function NewPoolButton(props: Props) {
  return (
    numAssociatedApplications(props) > 0 && (
      <LinkToNewPool
        key="new-pool-button"
        taskqueue={props.name}
        startOrAdd={numAssociatedWorkerPools(props) > 0 ? "add" : "start"}
      />
    )
  )
}
