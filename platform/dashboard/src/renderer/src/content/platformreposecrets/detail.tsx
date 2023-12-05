import type ManagedEvents from "../ManagedEvent"
import PlatformRepoSecretDetail from "./components/Detail"

export default function Gallery(id: string, events: ManagedEvents) {
  const secret = events.platformreposecrets.find((_) => _.metadata.name === id)
  if (secret) {
    return { body: PlatformRepoSecretDetail(secret) }
  } else {
    return undefined
  }
}
