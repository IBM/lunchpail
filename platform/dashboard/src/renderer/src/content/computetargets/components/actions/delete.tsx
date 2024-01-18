import { useCallback } from "react"

import type Props from "../Props"
import { singular } from "../../name"

import DeleteResourceButton from "@jay/components/DeleteResourceButton"

/** Button/Action: Delete this resource */
export default function DeleteAction(props: Props) {
  const deleteFn = useCallback(() => window.jay.deleteComputeTarget(props), [window.jay.deleteComputeTarget, props])

  return (
    <DeleteResourceButton
      singular={singular}
      kind="computetargets.codeflare.dev"
      deleteFn={deleteFn}
      name={props.metadata.name}
      namespace={props.metadata.namespace}
      context={props.metadata.context}
    />
  )
}
