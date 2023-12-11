import Input from "@jay/components/Forms/Input"
import TextArea from "@jay/components/Forms/TextArea"

import Values from "../Values"

const repo = (ctrl: Values) => (
  <Input fieldId="repo" label="Git Repo" description="The repo link that houses your Helm chart" ctrl={ctrl} />
)

const values = (ctrl: Values) => (
  <TextArea
    fieldId="values"
    label="Values"
    labelInfo="Provide this in YAML format"
    rows={10}
    language="yaml"
    isRequired={false}
    description="Optional override values to apply to the installation"
    ctrl={ctrl}
  />
)

/** Configuration items for a Helm-based WorkDispatcher */
export default [repo, values]
