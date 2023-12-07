import type Values from "../Values"

export default function parameterSweepYaml({ min, max, step }: Values["values"]) {
  return `
sweep:
  min: ${min}
  max: ${max}
  step: ${step}
`.trim()
}
