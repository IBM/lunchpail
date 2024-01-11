import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"

import router from "./router"
import Settings, { darkModeState, demoModeState, formState } from "./Settings"

import "@patternfly/react-core/dist/styles/base.css"

function App() {
  const darkMode = darkModeState() // UI in dark mode?
  const demoMode = demoModeState() // are we running in offline mode?
  const form = formState() // remember form choices made in wizards

  return (
    <Settings.Provider value={{ darkMode, demoMode, form }}>
      <RouterProvider router={router} />
    </Settings.Provider>
  )
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />)
