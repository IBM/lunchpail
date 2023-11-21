import { useCallback, useState } from "react"
import { Button, type FormContextProps } from "@patternfly/react-core"

import Input from "./Input"

import EyeIcon from "@patternfly/react-icons/dist/esm/icons/eye-icon"
import EyeSlashIcon from "@patternfly/react-icons/dist/esm/icons/eye-slash-icon"

const noPadding = { padding: 0 }

/** @return an Input component that allows for toggling clear text mode */
export default function password(props: { fieldId: string; label: string; description: string }) {
  /** Showing password in clear text? */
  const [clearText, setClearText] = useState(false)

  /** Toggle `clearText` state */
  const toggleClearText = useCallback(() => setClearText((curState) => !curState), [])

  return function pat(ctrl: FormContextProps) {
    return (
      <Input
        type={!clearText ? "password" : undefined}
        fieldId={props.fieldId}
        label={props.label}
        description={props.description}
        customIcon={
          <Button style={noPadding} variant="plain" onClick={toggleClearText}>
            {!clearText ? <EyeSlashIcon /> : <EyeIcon />}
          </Button>
        }
        ctrl={ctrl}
      />
    )
  }
}
