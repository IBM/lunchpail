import { StrictMode, useState } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"

import router from "./router"
import Settings from "./Settings"

function App() {
  // default to working in demo mode for now
  const demoMode = useState(true)

  return (
    <StrictMode>
      <Settings.Provider value={{ demoMode }}>
        <RouterProvider router={router} />
      </Settings.Provider>
    </StrictMode>
  )
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />)
