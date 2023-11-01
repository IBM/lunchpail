import { useEffect } from "react"

import { PrismAsyncLight as SyntaxHighlighter, type SyntaxHighlighterProps } from "react-syntax-highlighter"
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml"

import "./Yaml.scss"

export type Props = Partial<SyntaxHighlighterProps> & {
  children: string
  language?: string
  hasNoPadding?: boolean
}

export default function Yaml(props: Props) {
  useEffect(() => {
    SyntaxHighlighter.registerLanguage("yaml", yaml)
  }, [])

  return (
    <SyntaxHighlighter
      className="codeflare--syntax-highlighting"
      data-has-no-padding={props.hasNoPadding}
      language={props.language ?? "yaml"}
      style={PatternFlyTheme}
      showLineNumbers
      {...props}
    >
      {props.children}
    </SyntaxHighlighter>
  )
}

const PatternFlyTheme: Record<string, import("react").CSSProperties> = {
  'code[class*="language-"]': {
    color: "var(--pf-v5-global--Color--light-100)",
    background: "none",
    fontFamily: "RedHatMono, monospace",
    fontSize: "0.875rem",
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    wordWrap: "normal",
    lineHeight: "1.5",
    MozTabSize: "4",
    OTabSize: "4",
    tabSize: "4",
    WebkitHyphens: "none",
    MozHyphens: "none",
    msHyphens: "none",
    hyphens: "none",
    maxHeight: "inherit",
    height: "inherit",
    padding: "0.5em 1em",
    display: "block",
    overflow: "auto",
  },
  'pre[class*="language-"]': {
    color: "var(--pf-v5-global--Color--light-100)",
    background: "none",
    fontFamily: "RedHatMono, monospace",
    fontSize: "0.875rem",
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    wordWrap: "normal",
    lineHeight: "1.5",
    MozTabSize: "4",
    OTabSize: "4",
    tabSize: "4",
    WebkitHyphens: "none",
    MozHyphens: "none",
    msHyphens: "none",
    hyphens: "none",
    position: "relative",
    margin: "0",
    overflow: "visible",
    padding: "1px",
    backgroundColor: "transparent",
    WebkitBoxSizing: "border-box",
    MozBoxSizing: "border-box",
    boxSizing: "border-box",
  },
  'pre[class*="language-"] > code': {
    position: "relative",
    zIndex: "1",
    borderLeft: "10px solid #358ccb",
    boxShadow: "-1px 0px 0px 0px #358ccb, 0px 0px 0px 1px #dfdfdf",
    backgroundColor: "transparent",
    backgroundImage: "linear-gradient(transparent 50%, rgba(69, 142, 209, 0.04) 50%)",
    backgroundSize: "3em 3em",
    backgroundOrigin: "content-box",
    backgroundAttachment: "local",
  },
  ':not(pre) > code[class*="language-"]': {
    backgroundColor: "none",
    WebkitBoxSizing: "border-box",
    MozBoxSizing: "border-box",
    boxSizing: "border-box",
    marginBottom: "1em",
    position: "relative",
    padding: ".2em",
    borderRadius: "0.3em",
    color: "var(--pf-v5-global--active-color--200)",
    border: "1px solid rgba(0, 0, 0, 0.1)",
    display: "inline",
    whiteSpace: "normal",
  },
  'pre[class*="language-"]:before': {
    content: "''",
    display: "block",
    position: "absolute",
    bottom: "0.75em",
    left: "0.18em",
    width: "40%",
    height: "20%",
    maxHeight: "13em",
    boxShadow: "0px 13px 8px #979797",
    WebkitTransform: "rotate(-2deg)",
    msTransform: "rotate(-2deg)",
    OTransform: "rotate(-2deg)",
    transform: "rotate(-2deg)",
  },
  'pre[class*="language-"]:after': {
    content: "''",
    display: "block",
    position: "absolute",
    bottom: "0.75em",
    left: "auto",
    width: "40%",
    height: "20%",
    maxHeight: "13em",
    boxShadow: "0px 13px 8px #979797",
    WebkitTransform: "rotate(2deg)",
    msTransform: "rotate(2deg)",
    OTransform: "rotate(2deg)",
    transform: "rotate(2deg)",
    right: "0.75em",
  },
  comment: {
    color: "var(--pf-v5-global--palette--purple-50)",
  },
  "block-comment": {
    color: "var(--pf-v5-global--disabled-color--300)",
  },
  prolog: {
    color: "var(--pf-v5-global--disabled-color--300)",
  },
  doctype: {
    color: "var(--pf-v5-global--disabled-color--300)",
  },
  cdata: {
    color: "var(--pf-v5-global--disabled-color--300)",
  },
  punctuation: {
    color: "var(--pf-v5-global--palette--black-150)",
  },
  property: {
    color: "var(--pf-v5-global--active-color--200)",
  },
  tag: {
    color: "var(--pf-v5-global--active-color--200)",
  },
  boolean: {
    color: "var(--pf-v5-global--active-color--200)",
  },
  number: {
    color: "var(--pf-v5-global--active-color--400)",
  },
  "function-name": {
    color: "var(--pf-v5-global--active-color--200)",
  },
  constant: {
    color: "var(--pf-v5-global--active-color--200)",
  },
  symbol: {
    color: "var(--pf-v5-global--active-color--200)",
  },
  deleted: {
    color: "var(--pf-v5-global--active-color--200)",
  },
  selector: {
    color: "#2f9c0a",
  },
  "attr-name": {
    color: "#2f9c0a",
  },
  string: {
    color: "var(--pf-v5-global--palette--gold-100)",
  },
  char: {
    color: "#2f9c0a",
  },
  function: {
    color: "#2f9c0a",
  },
  builtin: {
    color: "#2f9c0a",
  },
  inserted: {
    color: "#2f9c0a",
  },
  operator: {
    color: "#a67f59",
  },
  entity: {
    color: "#a67f59",
    cursor: "help",
  },
  url: {
    color: "#a67f59",
  },
  variable: {
    color: "#a67f59",
  },
  atrule: {
    color: "var(--pf-v5-global--palette--light-blue-100)",
  },
  "attr-value": {
    color: "var(--pf-v5-global--palette--light-blue-100)",
  },
  keyword: {
    color: "var(--pf-v5-global--palette--light-blue-100)",
  },
  "class-name": {
    color: "var(--pf-v5-global--palette--light-blue-100)",
  },
  regex: {
    color: "#e90",
  },
  important: {
    color: "#e90",
    fontWeight: "normal",
  },
  ".language-css .token.string": {
    color: "#a67f59",
  },
  ".style .token.string": {
    color: "#a67f59",
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  namespace: {
    opacity: ".7",
  },
  'pre[class*="language-"].line-numbers.line-numbers': {
    paddingLeft: "0",
  },
  'pre[class*="language-"].line-numbers.line-numbers code': {
    paddingLeft: "3.8em",
  },
  'pre[class*="language-"].line-numbers.line-numbers .line-numbers-rows': {
    left: "0",
  },
  'pre[class*="language-"][data-line]': {
    paddingTop: "0",
    paddingBottom: "0",
    paddingLeft: "0",
  },
  "pre[data-line] code": {
    position: "relative",
    paddingLeft: "4em",
  },
  "pre .line-highlight": {
    marginTop: "0",
  },
}
