import { lazy, Suspense } from "react"
import { createBrowserRouter } from "react-router-dom"

import DemoDashboard from "../demo/DemoDashboard"
import LiveDashboard from "../pages/LiveDashboard"
const ErrorBoundary = lazy(() => import("../components/ErrorBoundary"))

import Settings from "../Settings"

const errorElement = (
  <Suspense fallback={<></>}>
    <ErrorBoundary />
  </Suspense>
)

function Dashboard() {
  return (
    <Suspense fallback={<div />}>
      <Settings.Consumer>
        {(settings) => (settings && settings.demoMode[0] ? <DemoDashboard /> : <LiveDashboard />)}
      </Settings.Consumer>
    </Suspense>
  )
}

export default createBrowserRouter([
  {
    path: "/*",
    element: <Dashboard />,
    errorElement,
  },
  {
    path: "/demo",
    element: <DemoDashboard />,
    errorElement,
  },
])
