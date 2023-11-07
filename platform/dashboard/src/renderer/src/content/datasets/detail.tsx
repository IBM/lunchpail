import DataSetDetail from "./components/Detail"
import type ManagedEvents from "../ManagedEvent"

export default function Detail(id: string, events: ManagedEvents) {
  const props = events.datasets.find((_) => _.metadata.name === id)
  if (props) {
    return <DataSetDetail {...props} />
  } else {
    return undefined
  }
}
