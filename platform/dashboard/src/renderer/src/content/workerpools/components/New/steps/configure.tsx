import Input from "@jay/components/Forms/Input"
import NumberInput from "@jay/components/Forms/NumberInput"

import { singular as workerpool } from "@jay/resources/workerpools/name"
import { groupSingular as application } from "@jay/resources/applications/group"

import type Values from "../Values"

function applicationChoice(ctrl: Values) {
  return (
    <Input
      readOnlyVariant="default"
      fieldId="application"
      label={application}
      description={`The workers in this ${workerpool} will run the code specified by this ${application}`}
      ctrl={ctrl}
    />
  )
}

/** Form element to choose number of workers in this new Worker Pool */
function numWorkers(ctrl: Values) {
  return (
    <NumberInput
      min={1}
      ctrl={ctrl}
      fieldId="count"
      label="Worker count"
      description="Number of Workers in this pool"
      defaultValue={ctrl.values.count ? parseInt(ctrl.values.count, 10) : 1}
    />
  )
}

export default {
  name: "Configure your " + workerpool,
  isValid: (ctrl: Values) => !!ctrl.values.application && !!ctrl.values.taskqueue,
  items: [applicationChoice, /* taskqueue, */ numWorkers],
}
