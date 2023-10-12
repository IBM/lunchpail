import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { StrictMode, useEffect, useState } from "react"

import router from "./router"
import Settings from "./Settings"

function App() {
  // default to working in demo mode for now
  const demoMode = useState(true)

  // is the local control plane good to go?
  const [controlPlaneReady, setControlPlaneReady] = useState(false)

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
