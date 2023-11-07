import { useCallback, useState } from "react"
import { Button, Modal, Tooltip } from "@patternfly/react-core"

import providers from "../content/providers"

import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon"

type Props = import("@jay/common/api/jay").DeleteProps & { uiKind: import("@jay/common/Kind").default; yaml?: string }

/**
 * Button that offers to delete a resource. It wraps the interacation
 * in a confirmation Modal.
 */
export default function DeleteResourceButton(props: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const handleModalToggle = useCallback(() => setIsModalOpen((curState) => !curState), [setIsModalOpen])

  const { kind, name, namespace } = props
  const onDelete = useCallback(() => {
    handleModalToggle()
    if (props.yaml) {
      window.jay.delete(props.yaml)
    } else if (kind && name && namespace) {
      window.jay.deleteByName({ kind, name, namespace })
    }
  }, [handleModalToggle, kind, name, namespace])

  return (
    <>
      <Tooltip content="Delete this resource">
        <Button size="lg" variant="plain" onClick={handleModalToggle}>
          <TrashIcon />
        </Button>
      </Tooltip>

      {isModalOpen && (
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
          Are you sure you wish to delete the {providers[props.uiKind].singular} <strong>{props.name}</strong>?
        </Modal>
      )}
    </>
  )
}
