import { useLocation, useNavigate } from "react-router-dom"

import { Dashboard } from "./Dashboard"
import type NewPoolHandler from "../events/NewPoolHandler"

const newpool: NewPoolHandler = {
  newPool: async (values, yaml) => {
    await fetch(`/newpool?yaml=${encodeURIComponent(yaml)}`)
  },
}

export default function LiveDashboard() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Dashboard
      location={location}
      navigate={navigate}
      datasets="/datasets"
      queues="/queues"
      pools="/pools"
      applications="/applications"
      newpool={newpool}
    />
  )
}
