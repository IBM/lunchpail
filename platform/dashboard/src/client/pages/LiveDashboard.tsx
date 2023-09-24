import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { Dashboard } from "./Dashboard"

import type { EventProps } from "./Dashboard"
import type NewPoolHandler from "../events/NewPoolHandler"

let props: null | EventProps<EventSource> = null

const newpool: NewPoolHandler = {
  newPool: async (values, yaml) => {
    await fetch(`/api/newpool?yaml=${encodeURIComponent(yaml)}`)
  },
}

/** TODO, how do we avoid listing the fields here? Typescript fu needed */
function newIfNeeded(source: "applications" | "datasets" | "pools" | "queues") {
  if (props && props[source]) {
    props[source].close()
  }

  return new EventSource(`/api/${source}`, { withCredentials: true })
}

function init() {
  const queues = newIfNeeded("queues")
  const datasets = newIfNeeded("datasets")
  const pools = newIfNeeded("pools")
  const applications = newIfNeeded("applications")

  props = {
    datasets,
    pools,
    newpool,
    queues,
    applications,
  }

  window.addEventListener("beforeunload", () => {
    queues.close()
    datasets.close()
    pools.close()
    applications.close()
  })

  return props
}

export default function LiveDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = useSearchParams()

  return <Dashboard {...init()} location={location} navigate={navigate} searchParams={searchParams[0]} />
}
