import { createBrowserRouter } from "react-router-dom"

import DemoDashboard from "../pages/DemoDashboard"
import LiveDashboard from "../pages/LiveDashboard"
import ErrorBoundary from "../components/ErrorBoundary"

import withLocation from "./withLocation"

export default createBrowserRouter([
  {
    path: "/",
    Component: withLocation(LiveDashboard),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/demo",
    Component: withLocation(DemoDashboard),
    errorElement: <ErrorBoundary />,
  },
])
