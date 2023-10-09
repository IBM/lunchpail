import NewCard from "../../NewCard"
import { LinkToNewPool } from "../../../navigate/newpool"

import type { LocationProps } from "../../../router/withLocation"

function AddWorkerPoolButton(props: Omit<LocationProps, "navigate">) {
  return <LinkToNewPool {...props} startOrAdd="create" />
}

export default function NewWorkerPoolCard(props: Omit<LocationProps, "navigate">) {
  return (
    <NewCard {...props} title="New Task Queue" description="Point to a Cloud data store that hosts the tasks.">
      <AddWorkerPoolButton {...props} />
    </NewCard>
  )
}
