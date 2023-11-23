import CodeMirror from "@uiw/react-codemirror"
import { useContext, useEffect } from "react"
import { githubLight, githubDark } from "@uiw/codemirror-theme-github"

import Settings from "@jay/renderer/Settings"

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
  const settings = useContext(Settings)
  const inDarkMode = settings?.darkMode[0]

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

  const theme = inDarkMode ? githubDark : githubLight

  return (
    <CodeMirror
      className="codeflare--code"
      data-show-line-numbers={String(props.showLineNumbers ?? true)}
      readOnly={props.readOnly ?? false}
      value={props.children}
      onChange={props.onChange}
      extensions={extensions}
      theme={theme}
    />
  )
}
