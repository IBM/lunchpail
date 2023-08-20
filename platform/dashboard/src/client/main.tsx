import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import { App } from "./App"
import RemoteFetcher from "./fetch/remote"
import DemoFetcher from "./fetch/remote"

import "@patternfly/react-core/dist/styles/base.css"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path={"/"} element={<App fetcher={new RemoteFetcher()} />} />
        <Route path={"/demo"} element={<App fetcher={new DemoFetcher()} />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
