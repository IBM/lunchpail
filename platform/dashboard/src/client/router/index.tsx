import { lazy } from "react"
import { createBrowserRouter } from "react-router-dom"

const DemoDashboard = lazy(() => import("../pages/DemoDashboard"))
const LiveDashboard = lazy(() => import("../pages/LiveDashboard"))
const ErrorBoundary = lazy(() => import("../components/ErrorBoundary"))

export default createBrowserRouter([
  {
    path: "/",
    element: import.meta.env.MODE === "demo" ? <DemoDashboard /> : <LiveDashboard />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/demo",
    element: <DemoDashboard />,
    errorElement: <ErrorBoundary />,
  },
])
