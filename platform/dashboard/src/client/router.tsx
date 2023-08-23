import { createBrowserRouter } from "react-router-dom"

import { App } from "./App"
import NewWorkerPool from "./pages/NewWorkerPool"
import ErrorBoundary from "./components/ErrorBoundary"
import { DemoDataSetEventSource, DemoWorkerPoolEventSource } from "./events/demo"

export default createBrowserRouter([
  {
    path: "/",
    element: <App datasets="/datasets" workerpools="/workerpools" route="/" />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/demo",
    element: (
      <App datasets={new DemoDataSetEventSource()} workerpools={new DemoWorkerPoolEventSource()} route="/demo" />
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/newpool",
    element: <NewWorkerPool />,
    errorElement: <ErrorBoundary />,
  },
])
