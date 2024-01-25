import Gallery from "@jaas/renderer/components/Gallery"

import type ManagedEvents from "../ManagedEvent"
import PlatformRepoSecretCard from "./components/Card"

export default function PlatformRepoSecretsGallery(events: ManagedEvents) {
  return (
    <Gallery>
      {events.platformreposecrets.map((props) => (
        <PlatformRepoSecretCard key={props.metadata.name} {...props} />
      ))}
    </Gallery>
  )
}
