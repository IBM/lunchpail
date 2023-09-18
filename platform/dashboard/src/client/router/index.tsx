import { lazy } from "react"
import { createBrowserRouter } from "react-router-dom"

const DemoDashboard = lazy(() => import("../pages/DemoDashboard"))
const LiveDashboard = lazy(() => import("../pages/LiveDashboard"))
const ErrorBoundary = lazy(() => import("../components/ErrorBoundary"))

export default createBrowserRouter([
  {
    path: "/",
    element: <LiveDashboard />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/demo",
    element: <DemoDashboard />,
    errorElement: <ErrorBoundary />,
  },
])
