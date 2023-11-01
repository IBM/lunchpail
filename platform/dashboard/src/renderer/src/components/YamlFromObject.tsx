import { dump } from "js-yaml"

import Yaml, { type Props } from "./Yaml"

export default function YamlFromObject(props: Omit<Props, "language" | "children"> & { obj: object }) {
  return (
    <Yaml showLineNumbers={false} {...props}>
      {dump(props.obj)}
    </Yaml>
  )
}
