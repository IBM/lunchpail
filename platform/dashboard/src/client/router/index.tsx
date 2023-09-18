import { createBrowserRouter } from "react-router-dom"

import DemoDashboard from "../pages/DemoDashboard"
import LiveDashboard from "../pages/LiveDashboard"
import ErrorBoundary from "../components/ErrorBoundary"

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
