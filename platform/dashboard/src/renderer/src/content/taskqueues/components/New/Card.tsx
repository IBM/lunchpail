import NewCard from "@jaas/components/NewCard"
import { LinkToNewPool } from "@jaas/renderer/navigate/newpool"

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
