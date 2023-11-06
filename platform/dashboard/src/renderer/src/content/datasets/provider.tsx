import { lazy } from "react"

import DataSetCard from "../../components/DataSet/Card"
import DataSetDetail from "../../components/DataSet/Detail"
const NewDataSetWizard = lazy(() => import("../../components/DataSet/New/Wizard"))

import { LinkToNewDataSet } from "../../components/DataSet/New/Button"

import type ManagedEvents from "../ManagedEvent"
import type ContentProvider from "../ContentProvider"

const datasets: ContentProvider = {
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
