import type ManagedEvents from "../ManagedEvent"
import PlatformRepoSecretDetail from "./components/Detail"

export default function Gallery(id: string, events: ManagedEvents) {
  return PlatformRepoSecretDetail(events.platformreposecrets.find((_) => _.metadata.name === id))
}
