import { useLocation, useNavigate } from "react-router-dom"

export type LocationProps = {
  location: ReturnType<typeof useLocation>
  navigate: ReturnType<typeof useNavigate>
}

/** Injects `LocationProps` into the given `Component` */
export default function withLocation(Component: import("react").FunctionComponent<LocationProps>) {
  return function ComponentWithLocation(props: object) {
    // we could also inject useParams() and other bits, as needed
    const location = useLocation()
    const navigate = useNavigate()
    return <Component {...props} location={location} navigate={navigate} />
  }
}
