import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider, useRouteError } from "react-router-dom"

import { App } from "./App"
import { DemoDataSetEventSource, DemoWorkerPoolEventSource } from "./events/demo"

import "@patternfly/react-core/dist/styles/base.css"

function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return <div>Internal Error</div>
}

const router = createBrowserRouter([
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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
