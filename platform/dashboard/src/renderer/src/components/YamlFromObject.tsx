import { dump } from "js-yaml"

import Yaml, { type Props } from "./Yaml"

export default function YamlFromObject(props: Omit<Props, "language" | "children"> & { obj: object | string }) {
  return (
    <Yaml showLineNumbers={false} {...props}>
      {dump(typeof props.obj === "string" ? JSON.parse(props.obj) : props.obj)}
    </Yaml>
  )
}
