import Code, { type Props as CodeProps, type SupportedLanguage } from "./Code"

export type Props = Omit<CodeProps, "language"> & {
  language?: SupportedLanguage
}

export default function Yaml(props: Props) {
  return (
    <Code {...props} language={props.language ?? "yaml"}>
      {props.children}
    </Code>
  )
}
