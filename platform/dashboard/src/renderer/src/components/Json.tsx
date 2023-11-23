import Yaml, { type Props } from "./Yaml"

export default function Json(props: Props) {
  if (props.children.length >= 12 * 1024) {
    // don't attempt to display giant JSON; intentionally just
    // slightly larger than the default fetch limit of
    // `window.jay.s3.getObject()`, slightly larger because we may
    // need to use `untruncate-json`, which may add a small amount of
    // data at the end.
    return props.children
  }

  return <Yaml language="json" showLineNumbers={props.showLineNumbers ?? false} {...props} />
}
