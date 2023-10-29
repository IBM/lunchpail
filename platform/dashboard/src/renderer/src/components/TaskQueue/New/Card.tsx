import NewCard from "../../NewCard"
import { LinkToNewPool } from "../../../navigate/newpool"

function AddWorkerPoolButton() {
  return <LinkToNewPool startOrAdd="create" />
}

export default function NewWorkerPoolCard() {
  return (
    <NewCard title="New Task Queue" description="Point to a Cloud data store that hosts the tasks.">
      <AddWorkerPoolButton />
    </NewCard>
  )
}
