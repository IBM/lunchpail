import { lazy, useContext, useEffect, useRef, StrictMode, Suspense } from "react"
import { createBrowserRouter, useLocation, useNavigate, useSearchParams } from "react-router-dom"

import navigateToHome from "./navigate/home"
import DemoDashboard from "./demo/DemoDashboard"
import LiveDashboard from "./pages/LiveDashboard"
const ErrorBoundary = lazy(() => import("./components/ErrorBoundary"))

import Settings from "./Settings"

/** How we handle a catastrophic failure */
const errorElement = (
  <Suspense fallback={<></>}>
    <ErrorBoundary />
  </Suspense>
)

/**
 * This is a thin wrapper over the Dashboard impls to allow the user
 * to choose between Live or Demo mode.
 */
function UserChoosesLiveOrDemoDashboard() {
  const settings = useContext(Settings)

  // When switching into or out of demo mode, close the drawer, as it
  // will show resource no longer relevant. Note: this needs to be
  // above StrictMode, otherwise our previousDemoMode logic won't work
  // -- StrictMode loads components twice.
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = useSearchParams()[0]
  const previousDemoMode = useRef(settings?.demoMode[0])
  useEffect(() => {
    //const cleanup = registerKeyboardEvents(navigate)

    const currentDemoMode = settings?.demoMode[0]
    if (previousDemoMode.current !== currentDemoMode) {
      navigateToHome({ location, navigate, searchParams })
      previousDemoMode.current = settings?.demoMode[0]
    }

    //return cleanup
  }, [settings?.demoMode[0]])

  return (
    <StrictMode>
      <Suspense fallback={<></>}>{settings?.demoMode[0] ? <DemoDashboard /> : <LiveDashboard />}</Suspense>
    </StrictMode>
  )
}

export default createBrowserRouter([
  {
    path: "/*",
    element: <UserChoosesLiveOrDemoDashboard />,
    errorElement,
  },
  {
    path: "/demo",
    element: <DemoDashboard />,
    errorElement,
  },
])
