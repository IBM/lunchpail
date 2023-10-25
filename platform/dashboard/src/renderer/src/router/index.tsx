import { lazy, useContext, Suspense } from "react"
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
  const settings = useContext(Settings)

  return <Suspense fallback={<></>}>{settings?.demoMode[0] ? <DemoDashboard /> : <LiveDashboard />}</Suspense>
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
