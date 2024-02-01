import Tiles from "@jaas/components/Forms/Tiles"

import type Values from "../Values"
import type Context from "../Context"

import { singular as computetarget } from "@jaas/resources/computetargets/name"

function targets(ctrl: Values, context: Context) {
  return (
    <Tiles
      ctrl={ctrl}
      fieldId="context"
      label={computetarget}
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
