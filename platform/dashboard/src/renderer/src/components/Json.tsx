import { useEffect } from "react"

import Yaml, { type Props } from "./Yaml"
import json from "react-syntax-highlighter/dist/esm/languages/prism/json"
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter"

export default function Json(props: Props) {
  if (props.children.length > 10 * 1024) {
    return props.children
  }

  useEffect(() => {
    SyntaxHighlighter.registerLanguage("json", json)
  }, [])

  return <Yaml language="json" {...props} />
}
