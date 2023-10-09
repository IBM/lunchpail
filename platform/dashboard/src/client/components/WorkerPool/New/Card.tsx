import NewCard from "../../NewCard"
import { linkToNewPool } from "../../../navigate/newpool"

import type { LocationProps } from "../../../router/withLocation"

function AddWorkerPoolButton(props: Omit<LocationProps, "navigate">) {
  return linkToNewPool(undefined, props, "create", { isInline: true, variant: "link" })
}

export default function NewWorkerPoolCard(props: Omit<LocationProps, "navigate">) {
  return (
    <NewCard
      {...props}
      title="New Worker Pool"
      description="Bring online additional compute resources to help service unprocessed tasks."
    >
      <AddWorkerPoolButton {...props} />
    </NewCard>
  )
}
