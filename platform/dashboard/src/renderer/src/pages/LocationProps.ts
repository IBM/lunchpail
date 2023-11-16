import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

export default function LocationProps() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = useSearchParams()[0]
  return { location, navigate, searchParams }
}
