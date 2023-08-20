import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import { App } from "./App"
import { DemoDataSetEventSource, DemoWorkerPoolEventSource } from "./events/demo"

import "@patternfly/react-core/dist/styles/base.css"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path={"/"} element={<App datasets="/datasets" workerpools="/workerpools" />} />
        <Route
          path={"/demo"}
          element={<App datasets={new DemoDataSetEventSource()} workerpools={new DemoWorkerPoolEventSource()} />}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
