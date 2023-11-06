import { lazy } from "react"

import PlatformRepoSecretCard from "./components/Card"
import PlatformRepoSecretDetail from "./components/Detail"
const NewPlatformRepoSecretWizard = lazy(() => import("./components/New/Wizard"))

import type ManagedEvents from "../ManagedEvent"
import type ContentProvider from "../ContentProvider"

const platformreposecrets: ContentProvider = {
  gallery: (events: ManagedEvents) =>
    events.platformreposecrets.map((props) => <PlatformRepoSecretCard key={props.metadata.name} {...props} />),
  detail: (id: string, events: ManagedEvents) =>
    PlatformRepoSecretDetail(events.platformreposecrets.find((_) => _.metadata.name === id)),
  wizard: () => <NewPlatformRepoSecretWizard />,
}

export default platformreposecrets
