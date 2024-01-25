import Tiles, { type TileOptions } from "@jaas/components/Forms/Tiles"

import type Values from "../Values"
import { type ComputeTargetType } from "@jaas/common/events/ComputeTargetEvent"

const typeOptions: TileOptions<ComputeTargetType> = [
  {
    title: "Kind",
    value: "Kind",
    description: "Run the workers on your laptop, as Pods in a local Kubernetes cluster that will be managed for you",
  },
]

function types(ctrl: Values) {
  return (
    <Tiles
      ctrl={ctrl}
      fieldId="type"
      label="Compute Target Type"
      description="Where do you want the workers to run?"
      options={typeOptions}
    />
  )
}

export default {
  name: "Choose where to run the workers",
  isValid: (ctrl: Values) => {
    return !!ctrl.values.type
  },
  items: (ctrl: Values) => [types(ctrl)],
}
