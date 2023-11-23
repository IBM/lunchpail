import { dump } from "js-yaml"

import Yaml, { type Props } from "./Yaml"
import trimJunk from "./Drawer/trim-junk"

export default function YamlFromObject(props: Omit<Props, "language" | "children"> & { obj: object | string }) {
  const { obj, ...rest } = props

  console.error("!!!!!!YO", props.readOnly, props)
  return (
    <Yaml readOnly={props.readOnly ?? true} showLineNumbers={props.showLineNumbers ?? false} {...rest}>
      {dump(JSON.parse(trimJunk(typeof obj === "string" ? JSON.parse(obj) : obj)))}
    </Yaml>
  )
}
