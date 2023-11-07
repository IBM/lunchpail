import type ManagedEvents from "../ManagedEvent"
import PlatformRepoSecretCard from "./components/Card"

export default function Gallery(events: ManagedEvents) {
  return events.platformreposecrets.map((props) => <PlatformRepoSecretCard key={props.metadata.name} {...props} />)
}
