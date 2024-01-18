import Tiles from "@jay/components/Forms/Tiles"

import type Values from "../Values"
import type Context from "../Context"

function targets(ctrl: Values, context: Context) {
  return (
    <Tiles
      ctrl={ctrl}
      fieldId="context"
      label="Compute Target"
      description="Where do you want the workers to run?"
      options={context.targetOptions}
    />
  )
}

export default {
  name: "Choose where to run the workers",
  isValid: (/*ctrl: Values*/) => {
    return true
  },
  items: (ctrl: Values, context: Context) => [targets(ctrl, context)],
}
