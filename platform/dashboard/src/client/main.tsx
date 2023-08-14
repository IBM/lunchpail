import React from "react"
import ReactDOM from "react-dom/client"

import { App } from "./App"

import "@patternfly/react-core/dist/styles/base.css"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
