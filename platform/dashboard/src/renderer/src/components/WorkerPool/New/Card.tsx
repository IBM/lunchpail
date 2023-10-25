import NewCard from "../../NewCard"
import { LinkToNewPool } from "../../../navigate/newpool"

function AddWorkerPoolButton() {
  return <LinkToNewPool startOrAdd="create" />
}

export default function NewWorkerPoolCard() {
  return (
    <NewCard
      title="New Worker Pool"
      description="Bring online additional compute resources to help service unprocessed tasks."
    >
      <AddWorkerPoolButton />
    </NewCard>
  )
}
