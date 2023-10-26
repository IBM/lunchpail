import { useEffect } from "react"

import { PrismAsyncLight as SyntaxHighlighter, type SyntaxHighlighterProps } from "react-syntax-highlighter"
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml"
import { coy as syntaxHighlightTheme } from "react-syntax-highlighter/dist/esm/styles/prism"

import "./Yaml.scss"

type Props = Partial<SyntaxHighlighterProps> & {
  content: string
}

export default function Yaml(props: Props) {
  useEffect(() => {
    SyntaxHighlighter.registerLanguage("yaml", yaml)
  }, [])

  return (
    <SyntaxHighlighter language="yaml" style={syntaxHighlightTheme} showLineNumbers {...props}>
      {props.content}
    </SyntaxHighlighter>
  )
}
