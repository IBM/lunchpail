import { dump } from "js-yaml"

import Yaml from "./Yaml"

export default function YamlFromObject(props: { obj: object }) {
  return <Yaml content={dump(props.obj)} showLineNumbers={false} />
}
