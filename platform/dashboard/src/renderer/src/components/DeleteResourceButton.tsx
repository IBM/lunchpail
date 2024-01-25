import { useCallback, useState } from "react"
import { Button, Modal, Tooltip } from "@patternfly/react-core"

import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon"

type Props = import("@jaas/common/api/jaas").DeleteProps & { singular: string; yaml?: string; deleteFn?: () => void }

/**
 * Button that offers to delete a resource. It wraps the interacation
 * in a confirmation Modal.
 */
export default function DeleteResourceButton(props: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const handleModalToggle = useCallback(() => setIsModalOpen((curState) => !curState), [setIsModalOpen])

  const { kind, name, namespace, context } = props
  const onDelete = useCallback(() => {
    handleModalToggle()
    if (props.deleteFn) {
      props.deleteFn()
    } else if (props.yaml) {
      window.jaas.delete(props.yaml)
    } else if (kind && name && namespace) {
      window.jaas.deleteByName({ kind, name, namespace, context })
    }
  }, [handleModalToggle, kind, name, namespace, window.jaas.delete, window.jaas.deleteByName, props.deleteFn])

  return (
    <>
      <Tooltip content="Delete this resource">
        <Button ouiaId="trashButton" size="lg" variant="plain" onClick={handleModalToggle}>
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
          Are you sure you wish to delete the {props.singular} <strong>{props.name}</strong>?
        </Modal>
      )}
    </>
  )
}
