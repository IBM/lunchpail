import { Button } from "@patternfly/react-core"

export default function DeleteButton(props: import("@jay/common/api/jay").DeleteProps) {
  return (
    <Button key="delete" variant="danger" onClick={() => window.jay.delete(props)}>
      Delete
    </Button>
  )
}
