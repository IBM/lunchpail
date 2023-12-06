import { Button } from "@patternfly/react-core"
import { useNavigate } from "react-router-dom"
import { useCallback, useEffect, useState, type ReactElement } from "react"

import Actions from "./Actions"

import BackIcon from "@patternfly/react-icons/dist/esm/icons/arrow-left-icon"
import ForwardIcon from "@patternfly/react-icons/dist/esm/icons/arrow-right-icon"

function go(ouiaId: string, icon: ReactElement, onClick: () => void, isDisabled = false) {
  return (
    <Button key={ouiaId} ouiaId={ouiaId} size="lg" variant="plain" onClick={onClick} isDisabled={isDisabled}>
      {icon}
    </Button>
  )
}

/**
 * Register keyboard shortcuts for browser-back and browser-forward
 *
 * @return a cleanup function that will deregister event handlers
 */
function registerKeyboardEvents(navigate: ReturnType<typeof useNavigate>) {
  const handler = (evt: KeyboardEvent) => {
    if (evt.metaKey || evt.altKey) {
      switch (evt.key) {
        case "ArrowLeft":
          navigate(-1)
          break
        case "ArrowRight":
          navigate(+1)
          break
      }
    }
  }
  window.addEventListener("keydown", handler)

  // return a cleanup function
  return () => window.removeEventListener("keydown", handler)
}

export default function HistoryActions() {
  const navigate = useNavigate()
  const [, setBackCount] = useState(0)

  useEffect(() => registerKeyboardEvents(navigate), [navigate])

  const back = useCallback(() => {
    setBackCount((count) => count + 1)
    navigate(-1)
  }, [navigate, setBackCount])
  const forward = useCallback(() => {
    setBackCount((count) => count - 1)
    navigate(1)
  }, [navigate, setBackCount])

  const actions = [go("back", <BackIcon />, back), go("forward", <ForwardIcon />, forward)]

  return <Actions variant="icon-button-group">{actions}</Actions>
}
