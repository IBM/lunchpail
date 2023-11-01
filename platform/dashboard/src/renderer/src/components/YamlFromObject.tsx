import { dump } from "js-yaml"

import Yaml from "./Yaml"

export default function YamlFromObject(props: { obj: object }) {
  return <Yaml showLineNumbers={false}>{dump(props.obj)}</Yaml>
}
