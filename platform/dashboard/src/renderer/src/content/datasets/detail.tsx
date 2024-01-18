import DataSetDetail from "./components/Detail"
import type ManagedEvents from "../ManagedEvent"

export default function Detail(id: string, context: string, events: ManagedEvents) {
  const props = events.datasets.find((_) => _.metadata.name === id && (!context || _.metadata.context === context))
  if (props) {
    return { body: <DataSetDetail {...props} /> }
  } else {
    return undefined
  }
}
