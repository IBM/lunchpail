import { useCallback, useState } from "react"
import { Button, Modal, Text, Title, Tooltip } from "@patternfly/react-core"

import type Kind from "../Kind"
import { singular } from "../names"

import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon"

export default function DeleteButton(props: import("@jay/common/api/jay").DeleteProps & { uiKind: Kind }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const handleModalToggle = useCallback(() => setIsModalOpen((curState) => !curState), [setIsModalOpen])

  const { kind, name, namespace } = props
  const onDelete = useCallback(() => {
    handleModalToggle()
    if (kind && name && namespace) {
      window.jay.delete({ kind, name, namespace })
    }
  }, [handleModalToggle, kind, name, namespace])

  return (
    <>
      <Tooltip
        content={
          <>
            <Title headingLevel="h4">Caution</Title>
            <Text component="p">Clicking here will delete this resource</Text>
          </>
        }
      >
        <Button
          size="lg"
          variant="plain"
          data-kind={props.kind}
          data-name={props.name}
          data-namespace={props.namespace}
          onClick={handleModalToggle}
        >
          <TrashIcon />
        </Button>
      </Tooltip>

      <Modal
        variant="small"
        title="Confirm Deletion"
        titleIconVariant="danger"
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        actions={[
          <Button key="confirm" variant="primary" onClick={onDelete}>
            Confirm
          </Button>,
          <Button key="cancel" variant="link" onClick={handleModalToggle}>
            Cancel
          </Button>,
        ]}
      >
        Are you sure you wish to delete the {singular[props.uiKind]} <strong>{props.name}</strong>?
      </Modal>
    </>
  )
}
