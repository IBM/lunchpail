import { useRouteError } from "react-router-dom"

export default function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return <div>Internal Error</div>
}
