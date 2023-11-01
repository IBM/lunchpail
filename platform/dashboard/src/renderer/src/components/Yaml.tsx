import { useEffect } from "react"

import { PrismAsyncLight as SyntaxHighlighter, type SyntaxHighlighterProps } from "react-syntax-highlighter"
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml"
import { coy as syntaxHighlightTheme } from "react-syntax-highlighter/dist/esm/styles/prism"

import "./Yaml.scss"

export type Props = Partial<SyntaxHighlighterProps> & {
  children: string
  language?: string
}

export default function Yaml(props: Props) {
  useEffect(() => {
    SyntaxHighlighter.registerLanguage("yaml", yaml)
  }, [])

  return (
    <SyntaxHighlighter language={props.language ?? "yaml"} style={syntaxHighlightTheme} showLineNumbers {...props}>
      {props.children}
    </SyntaxHighlighter>
  )
}
