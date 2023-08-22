import { createBrowserRouter } from "react-router-dom"

import { App } from "./App"
import ErrorBoundary from "./components/ErrorBoundary"
import { DemoDataSetEventSource, DemoWorkerPoolEventSource } from "./events/demo"

export default createBrowserRouter([
  {
    path: "/",
    element: <App datasets="/datasets" workerpools="/workerpools" />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/demo",
    element: <App datasets={new DemoDataSetEventSource()} workerpools={new DemoWorkerPoolEventSource()} />,
    errorElement: <ErrorBoundary />,
  },
])
