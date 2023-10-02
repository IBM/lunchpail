import { lazy, Suspense } from "react"
import { createBrowserRouter } from "react-router-dom"

const DemoDashboard = lazy(() => import("../demo/DemoDashboard"))
const LiveDashboard = lazy(() => import("../pages/LiveDashboard"))
const ErrorBoundary = lazy(() => import("../components/ErrorBoundary"))

const errorElement = (
  <Suspense fallback={<></>}>
    <ErrorBoundary />
  </Suspense>
)

export default createBrowserRouter([
  {
    path: "/",
    element: import.meta.env.MODE === "demo" ? <DemoDashboard /> : <LiveDashboard />,
    errorElement,
  },
  {
    path: "/demo",
    element: <DemoDashboard />,
    errorElement,
  },
])
