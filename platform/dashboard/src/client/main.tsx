import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import { App } from "./App"

import "@patternfly/react-core/dist/styles/base.css"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path={"/"} element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
