import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"

import router from "./router"
import Status, { statusState } from "./Status"
import Settings, { darkModeState, demoModeState, prsUserState } from "./Settings"

function App() {
  const darkMode = darkModeState() // UI in dark mode?
  const demoMode = demoModeState() // are we running in offline mode?
  const prsUser = prsUserState() // user for PlatformRepoSecrets

  // is the local control plane good to go? null means unknown
  // (e.g. that a check is in progress)
  const [status] = statusState(demoMode)

  return (
    <StrictMode>
      <Settings.Provider value={{ darkMode, demoMode, prsUser }}>
        <Status.Provider value={status}>
          <RouterProvider router={router} />
        </Status.Provider>
      </Settings.Provider>
    </StrictMode>
  )
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />)
