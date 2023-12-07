import Input from "@jay/components/Forms/Input"

import Values from "../Values"

const repo = (ctrl: Values) => (
  <Input fieldId="repo" label="Git Repo" description="The repo link that houses your Helm chart" ctrl={ctrl} />
)

/** Configuration items for a Helm-based WorkDispatcher */
export default [repo]
