import type { useLocation, useNavigate, useSearchParams } from "react-router-dom"

type LocationProps = {
  location: ReturnType<typeof useLocation>
  navigate: ReturnType<typeof useNavigate>
  searchParams: ReturnType<typeof useSearchParams>[0]
}

export default LocationProps
