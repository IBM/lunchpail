import { useLocation, useNavigate } from "react-router-dom"

import { Dashboard } from "./Dashboard"

import type { EventProps } from "./Dashboard"
import type NewPoolHandler from "../events/NewPoolHandler"

let props: null | EventProps = null

const newpool: NewPoolHandler = {
  newPool: async (values, yaml) => {
    await fetch(`/api/newpool?yaml=${encodeURIComponent(yaml)}`)
  },
}

function init() {
  if (props === null) {
    const queues = new EventSource("/api/datasets", { withCredentials: true })
    const datasets = new EventSource("/api/datasets", { withCredentials: true })
    const pools = new EventSource("/api/pools", { withCredentials: true })
    const applications = new EventSource("/api/applications", { withCredentials: true })

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
  }

  return props
}

export default function LiveDashboard() {
  const location = useLocation()
  const navigate = useNavigate()

  return <Dashboard {...init()} location={location} navigate={navigate} />
}
