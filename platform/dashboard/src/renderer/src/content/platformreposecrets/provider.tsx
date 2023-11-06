import { lazy } from "react"

import PlatformRepoSecretCard from "./components/Card"
import PlatformRepoSecretDetail from "./components/Detail"
const NewPlatformRepoSecretWizard = lazy(() => import("./components/New/Wizard"))

import { name, singular } from "./name"

import type ManagedEvents from "../ManagedEvent"
import type ContentProvider from "../ContentProvider"

const platformreposecrets: ContentProvider = {
  name,

  singular,

  description: (
    <span>The registered GitHub credentials that can be used to clone repositories from a particular GitHub URL.</span>
  ),

  gallery: (events: ManagedEvents) =>
    events.platformreposecrets.map((props) => <PlatformRepoSecretCard key={props.metadata.name} {...props} />),

  detail: (id: string, events: ManagedEvents) =>
    PlatformRepoSecretDetail(events.platformreposecrets.find((_) => _.metadata.name === id)),

  wizard: () => <NewPlatformRepoSecretWizard />,
}

export default platformreposecrets
