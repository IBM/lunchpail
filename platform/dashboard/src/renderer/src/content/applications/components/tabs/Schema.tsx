import Yaml from "@jay/components/YamlFromObject"

import type Props from "../Props"

/** Tab that shows the Task Schema of this Application */
export default function taskSchemaTab(props: Props) {
  const { inputs } = props.application.spec

  return inputs && inputs.length > 0 && typeof inputs[0].schema === "object"
    ? [
        {
          title: "Schema",
          body: <Yaml showLineNumbers={false} obj={JSON.parse(inputs[0].schema.json)} />,
          hasNoPadding: true,
        },
      ]
    : []
}
