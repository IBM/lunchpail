import { useEffect } from "react"

import Yaml, { type Props } from "./Yaml"
import json from "react-syntax-highlighter/dist/esm/languages/prism/json"
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter"

export default function Json(props: Props) {
  if (props.children.length >= 12 * 1024) {
    // don't attempt to display giant JSON; intentionally just
    // slightly larger than the default fetch limit of
    // `window.jay.s3.getObject()`, slightly larger because we may
    // need to use `untruncate-json`, which may add a small amount of
    // data at the end.
    return props.children
  }

  useEffect(() => {
    SyntaxHighlighter.registerLanguage("json", json)
  }, [])

  return <Yaml language="json" {...props} />
}
