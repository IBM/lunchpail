import { createBrowserRouter } from "react-router-dom"

import { App } from "./App"
import NewWorkerPool from "./pages/NewWorkerPool"
import ErrorBoundary from "./components/ErrorBoundary"
import { DemoDataSetEventSource, DemoQueueEventSource, DemoWorkerPoolStatusEventSource } from "./events/demo"

export default createBrowserRouter([
  {
    path: "/",
    element: <App datasets="/datasets" queues="/queues" pools="/pools" route="/" />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/demo",
    element: (
      <App
        datasets={new DemoDataSetEventSource()}
        queues={new DemoQueueEventSource()}
        pools={new DemoWorkerPoolStatusEventSource()}
        route="/demo"
      />
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/newpool",
    element: <NewWorkerPool />,
    errorElement: <ErrorBoundary />,
  },
])
