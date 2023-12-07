import NumberInput from "@jay/components/Forms/NumberInput"

import Values from "../Values"

const minValue = (ctrl: Values) => (
  <NumberInput
    fieldId="min"
    label="Minimum Value"
    description="The parameter sweep will start here"
    defaultValue={parseInt(ctrl.values.min, 10)}
    ctrl={ctrl}
  />
)

const maxValue = (ctrl: Values) => (
  <NumberInput
    fieldId="max"
    label="Maximum Value"
    description="The parameter sweep will end here"
    defaultValue={parseInt(ctrl.values.max, 10)}
    ctrl={ctrl}
  />
)

const step = (ctrl: Values) => (
  <NumberInput
    fieldId="step"
    label="Step"
    description="The parameter sweep step from min to max"
    defaultValue={parseInt(ctrl.values.step, 10)}
    ctrl={ctrl}
  />
)

/** Configuration items for a Parameter Sweep */
export default [minValue, maxValue, step]
