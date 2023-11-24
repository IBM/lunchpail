import { useEffect } from "react"
import { tags as t } from "@lezer/highlight"
import CodeMirror from "@uiw/react-codemirror"
import { createTheme } from "@uiw/codemirror-themes"

// support for languages
import { json } from "@codemirror/lang-json"
import { python } from "@codemirror/lang-python"
import * as yamlMode from "@codemirror/legacy-modes/mode/yaml"
import * as shellMode from "@codemirror/legacy-modes/mode/shell"
import { StreamLanguage, LanguageSupport } from "@codemirror/language"

import "./Code.css"

export type SupportedLanguage = "python" | "shell" | "json" | "yaml"

export type Props = {
  children: string
  language: SupportedLanguage
  onChange?: (val: string) => void
  readOnly?: boolean
  showLineNumbers?: boolean
}

export default function Code(props: Props) {
  // <CodeMirror/> doesn't call our `props.onChange` the first time,
  // though it will call that `onChange` on subsequent updates. Hence,
  // we need this "onMount" handler to push the initial value back
  useEffect(() => {
    if (props.onChange) {
      props.onChange(props.children)
    }
  }, [props.children])

  // which language extension do we want to use?
  const extensions =
    props.language === "python"
      ? [python()]
      : props.language === "shell"
        ? [new LanguageSupport(StreamLanguage.define(shellMode.shell))]
        : props.language === "yaml"
          ? [new LanguageSupport(StreamLanguage.define(yamlMode.yaml))]
          : [json()]

  return (
    <CodeMirror
      className="codeflare--code"
      data-show-line-numbers={String(props.showLineNumbers ?? true)}
      readOnly={props.readOnly ?? false}
      value={props.children}
      onChange={props.onChange}
      extensions={extensions}
      theme={patternflyTheme}
    />
  )
}

const patternflyTheme = createTheme({
  theme: "dark",
  settings: {
    background: "var(--pf-v5-global--BackgroundColor--dark-100)",
    foreground: "var(--pf-v5-global--Color--light-100)",
    caret: "#c9d1d9",
    selection: "#003d73",
    selectionMatch: "#003d73",
    lineHighlight: "#36334280",
  },
  styles: [
    { tag: [t.standard(t.tagName), t.tagName], color: "var(--pf-v5-global--palette--orange-100)" },
    { tag: [t.comment, t.bracket], color: "var(--pf-v5-global--palette--purple-50)" },
    { tag: [t.className, t.propertyName], color: "var(--pf-v5-global--palette--light-blue-100)" },
    { tag: [t.variableName, t.attributeName, t.number, t.operator], color: "var(--pf-v5-global--palette--blue-50)" },
    { tag: [t.keyword, t.typeName, t.typeOperator, t.typeName], color: "var(--pf-v5-global--palette--cyan-200)" },
    { tag: [t.string, t.meta, t.regexp], color: "var(--pf-v5-global--palette--gold-200)" },
    { tag: [t.name, t.quote], color: "#7ee787" },
    { tag: [t.heading, t.strong], color: "#d2a8ff", fontWeight: "bold" },
    { tag: [t.emphasis], color: "#d2a8ff", fontStyle: "italic" },
    { tag: [t.deleted], color: "#ffdcd7", backgroundColor: "ffeef0" },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: "var(--pf-v5-global--palette--light-blue-200)" },
    { tag: t.link, textDecoration: "underline" },
    { tag: t.strikethrough, textDecoration: "line-through" },
    { tag: t.invalid, color: "#f97583" },
  ],
})
