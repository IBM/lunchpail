import { lazy } from "react"
import { Link } from "react-router-dom"

import DataSetCard from "./components/Card"
import DataSetDetail from "./components/Detail"
import { LinkToNewDataSet } from "./components/New/Button"
const NewDataSetWizard = lazy(() => import("./components/New/Wizard"))

import { hash } from "@jay/renderer/navigate/kind"
import { name, singular } from "./name"

import type ManagedEvents from "../ManagedEvent"
import type ContentProvider from "../ContentProvider"

const datasets: ContentProvider<"datasets"> = {
  kind: "datasets",

  name,

  singular,

  description: (
    <span>
      Each <strong>Dataset</strong> resource stores extra data needed by{" "}
      <Link to={hash("applications")}>Applications</Link>, beyond that which is provided by an input Task. For example:
      a pre-trained model or a chip design that is being tested across multiple configurations.
    </span>
  ),

  isInSidebar: true,

  gallery: (events: ManagedEvents) => events.datasets.map((evt) => <DataSetCard key={evt.metadata.name} {...evt} />),

  detail: (id: string, events: ManagedEvents) => {
    const props = events.datasets.find((_) => _.metadata.name === id)
    if (props) {
      return <DataSetDetail {...props} />
    } else {
      return undefined
    }
  },

  actions: (settings: { inDemoMode: boolean }) => !settings.inDemoMode && <LinkToNewDataSet startOrAdd="add" />,

  wizard: () => <NewDataSetWizard />,
}

export default datasets
