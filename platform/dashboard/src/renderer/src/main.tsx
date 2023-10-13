import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { StrictMode, useEffect, useState, SetStateAction } from "react"

import router from "./router"
import Settings, { restoreDemoMode, saveDemoMode } from "./Settings"

function App() {
  // default to working in demo mode for now
  const demoMode = useState(restoreDemoMode())
  const origSetDemoMode = demoMode[1]

  // override the updater so that we can persist the choice
  demoMode[1] = (action: SetStateAction<boolean>) => {
    const newDemoMode = typeof action === "boolean" ? action : action(demoMode[0])
    saveDemoMode(newDemoMode) // persist
    origSetDemoMode(action) // react
  }

  // is the local control plane good to go? null means unknown
  // (e.g. that a check is in progress)
  const [controlPlaneReady, setControlPlaneReady] = useState<null | boolean>(null)

  // launch an effect that triggers a control plane readiness check
  // whenever entering non-demo/live mode
  useEffect(() => {
    async function checkControlPlaneStatus() {
      if (!demoMode[0]) {
        // determine current cluster status
        const isReady = await window.jaas.controlplane.status()
        setControlPlaneReady(isReady)
        console.log("Control Plane Ready?", isReady)
      }
    }
    checkControlPlaneStatus()
  }, [demoMode[0]])

  return (
    <StrictMode>
      <Settings.Provider value={{ demoMode, controlPlaneReady }}>
        <RouterProvider router={router} />
      </Settings.Provider>
    </StrictMode>
  )
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />)
