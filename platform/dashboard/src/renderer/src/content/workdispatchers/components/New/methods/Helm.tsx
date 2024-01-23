import { load } from "js-yaml"
import { Text } from "@patternfly/react-core"

import Input from "@jay/components/Forms/Input"
import TextArea from "@jay/components/Forms/TextArea"

import Values from "../Values"

const repo = (ctrl: Values) => (
  <Input fieldId="repo" label="Git Repo" description="The repo link that houses your Helm chart" ctrl={ctrl} />
)

/** A values.yaml to use with the Helm install */
const values = (ctrl: Values) => (
  <TextArea
    fieldId="values"
    label="Values"
    labelInfo="Provide this in YAML format"
    rows={10}
    showLineNumbers
    language="yaml"
    isRequired={false}
    description="Optional override values to apply to the installation"
    ctrl={ctrl}
  />
)

/** Configuration items for a Helm-based WorkDispatcher */
export default [repo, values]

/** This helps with pretty-printing Errors */
function hasMessage(err: unknown): err is Error {
  return typeof (err as { message: string }).message === "string"
}

/**
 * Here we validate the values as yaml. If the text cannot be parsed
 * as such, we will report the parse errors to the user via an Alert
 * spec.
 */
export function helmIsValid({ values }: Values["values"]) {
  try {
    load(values)
    return true
  } catch (err) {
    console.error("Invalid yaml", values, err)
    return [
      {
        title: "Invalid YAML",
        body: (
          <Text component="pre" style={prewrap}>
            {hasMessage(err) ? err.message : String(err)}
          </Text>
        ),
        variant: "danger" as const,
      },
    ]
  }
}

const prewrap = { whiteSpace: "pre-wrap" as const }
