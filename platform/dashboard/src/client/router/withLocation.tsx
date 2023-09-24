import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

export type LocationProps = {
  location: ReturnType<typeof useLocation>
  navigate: ReturnType<typeof useNavigate>
  searchParams: ReturnType<typeof useSearchParams>[0]
}
